import re
import os

FILE_PATH = r"d:\Xebia-Student-Trainer\src\context\LMSContext.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove imports
content = re.sub(r"import\s+\{.*?\}\s+from\s+'\.\./data/dummyData';\n", "", content)
content = re.sub(r"import\s+\{.*?\}\s+from\s+'\.\./data/codingData';\n", "", content)

# Replace coding defaults
content = content.replace("return data ? JSON.parse(data) : initialCodingSubmissions;", "return data ? JSON.parse(data) : [];")
content = content.replace("return data ? JSON.parse(data) : initialCodingLeaderboard;", "return data ? JSON.parse(data) : [];")
content = content.replace("return data ? JSON.parse(data) : initialNotifications;", "return data ? JSON.parse(data) : [];")

# Replace setAssessments([...a, ...initialCodingAssessments]); with setAssessments(a);
content = content.replace("setAssessments([...a, ...initialCodingAssessments]);", "setAssessments(a);")

# Remove catch block fallbacks
catch_block_pattern = r"""      \} catch \(err\) \{
        console\.error\("Backend connection failed, using dummy data fallback\.", err\);
        setTeachers\(initialTeachers\);
        setStudents\(initialStudents\);
        setBatches\(initialBatches\);
        setAssessments\(\[\.\.\.initialAssessments, \.\.\.initialCodingAssessments\]\);
        setSubmissions\(initialSubmissions\);
      \}"""

new_catch_block = """      } catch (err) {
        console.error("Backend connection failed.", err);
      }"""

content = re.sub(catch_block_pattern, new_catch_block, content, flags=re.DOTALL)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed dummy data from LMSContext")
