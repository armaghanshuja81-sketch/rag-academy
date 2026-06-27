#variables
name = "Armaghan Shuja"
age = 20
height = 5.9
is_university_student = True

print (name)
print (age)
print (type(age))
print (height)

#strings
name = "Muhammad Armaghan Shuja"
full_name = name + " Malik "
print(f"Hello, {name}")
print(name.upper())
print(len(full_name))
print(full_name)
print(name[3:8])

#lists & Tuples
WorldCup_Football_Teams = ["Argentina", "Brazil", "Portugal", "Spain"]
print(WorldCup_Football_Teams[3])
t = (1, 2, 3)
WorldCup_Football_Teams.append("date")
for f in WorldCup_Football_Teams:
    print(f)
    
#Dictionaries && Sets
student = {"name": "Armaghan", "age": 20, "height": 2.9}
print(student["name"])
print(student["age"])
print(student["height"])
student["email"] = "armaghanshuja81@gmail.com"
print(student["email"])
for i, j in student.items():
    print(f"{i}: {j}")
    