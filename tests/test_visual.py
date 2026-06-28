"""
Visual smoke tests for RAG Academy — Claymorphism design.
Run: python tests/test_visual.py
Requires: pip install playwright && python -m playwright install chromium
"""
import subprocess
import time
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def start_server():
    """Start Flask dev server and return the process."""
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "app.py")],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(ROOT)
    )
    # Wait for server to start
    for _ in range(20):
        time.sleep(0.5)
        if proc.poll() is not None:
            out, err = proc.communicate()
            print(f"SERVER DIED: {out} {err}")
            raise RuntimeError("Flask server failed to start")
        try:
            import urllib.request
            urllib.request.urlopen("http://localhost:5000")
            print("Server ready at http://localhost:5000")
            return proc
        except Exception:
            pass
    raise RuntimeError("Server did not start in time")

def run_tests():
    from playwright.sync_api import sync_playwright

    # Start server
    server = start_server()

    screenshots = ROOT / "tests" / "screenshots"
    screenshots.mkdir(exist_ok=True)

    pages = [
        ("home", "/"),
        ("lessons", "/lessons"),
        ("lesson-welcome", "/lesson/welcome"),
        ("lesson-python", "/lesson/py_variables"),
        ("lesson-rag", "/lesson/rag_architecture"),
        ("lesson-langchain", "/lesson/langchain_intro"),
        ("roadmap", "/roadmap"),
        ("python-playground", "/python-playground"),
        ("database-viewer", "/database"),
        ("data-flow", "/data-flow"),
        ("rag-demo", "/rag-demo"),
    ]

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            context = browser.new_context(viewport={"width": 1280, "height": 900})
            page = context.new_page()

            results = []
            for name, path in pages:
                url = f"http://localhost:5000{path}"
                try:
                    page.goto(url, wait_until="networkidle", timeout=15000)
                    page.screenshot(path=str(screenshots / f"{name}.png"), full_page=True)
                    title = page.title()
                    print(f"  OK  {name:25s} -> {title[:60]}")
                    results.append((name, True, title))
                except Exception as e:
                    print(f"  FAIL {name:25s} -> {str(e)[:80]}")
                    results.append((name, False, str(e)))

            # Test dark mode
            print("\nDark mode test:")
            page.goto("http://localhost:5000/", wait_until="networkidle")
            toggle = page.locator("#theme-toggle")
            if toggle.count() > 0:
                toggle.click()
                time.sleep(0.5)
                theme = page.evaluate("document.documentElement.getAttribute('data-theme')")
                print(f"  Theme after toggle: {theme}")
                page.screenshot(path=str(screenshots / "home-dark.png"), full_page=True)
            else:
                print("  No theme toggle found")

            # Test lesson navigation
            print("\nLesson navigation test:")
            page.goto("http://localhost:5000/lesson/py_variables", wait_until="networkidle")
            page.screenshot(path=str(screenshots / "lesson-py-variables.png"), full_page=True)

            # Test mark complete
            mark_btn = page.locator("form[action*='mark-complete'] button")
            if mark_btn.count() > 0:
                mark_btn.click()
                time.sleep(0.5)
            flash = page.locator(".clay-alert, .flash-message")
            if flash.count() > 0:
                print(f"  Flash message visible: {flash.first.text_content()[:60]}")

            # Test Python playground
            print("\nPython playground test:")
            page.goto("http://localhost:5000/python-playground", wait_until="networkidle")
            textarea = page.locator("textarea")
            if textarea.count() > 0:
                textarea.fill("print('RAG Academy test!')\nprint(sum([1,2,3,4,5]))")
                page.locator("button:has-text('Run')").click()
                time.sleep(2)
                try:
                    page.screenshot(path=str(screenshots / "playground-run.png"), full_page=True, timeout=10000)
                except Exception:
                    print("  Playground screenshot skipped (font timeout)")
            print("  Playground test complete")

            # Test RAG demo
            print("\nRAG demo test:")
            page.goto("http://localhost:5000/rag-demo", wait_until="networkidle")
            query_input = page.locator("input[name='query']")
            if query_input.count() > 0:
                query_input.fill("What is RAG?")
                query_input.press("Enter")
                time.sleep(1.5)
                page.screenshot(path=str(screenshots / "rag-demo-query.png"), full_page=True)
            print("  RAG demo test complete")

            # Summary
            passed = sum(1 for _, ok, _ in results if ok)
            failed = sum(1 for _, ok, _ in results if not ok)
            print(f"\n{'='*50}")
            print(f"Results: {passed} passed, {failed} failed, {len(pages)} total")
            print(f"Screenshots: {screenshots}")
            print(f"{'='*50}")

            browser.close()

            if failed > 0:
                sys.exit(1)

    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    run_tests()
