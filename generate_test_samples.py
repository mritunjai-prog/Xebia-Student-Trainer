import requests
import json
import time

USER_SERVICE = "http://localhost:8081/api/v1"
BATCH_SERVICE = "http://localhost:8082/api/v1"
ASSESSMENT_SERVICE = "http://localhost:8083/api/v1"

def log(msg, success=True):
    prefix = "[PASS] " if success else "[FAIL] "
    print(f"{prefix}{msg}")

def check_backend():
    try:
        res1 = requests.get(f"{USER_SERVICE}/users", timeout=2.0)
        res2 = requests.get(f"{BATCH_SERVICE}/batches", timeout=2.0)
        res3 = requests.get(f"{ASSESSMENT_SERVICE}/assessments", timeout=2.0)
        return res1.status_code == 200 and res2.status_code == 200 and res3.status_code == 200
    except Exception:
        return False

def main():
    print("==================================================")
    print("   XEBIA LMS CERTIFICATE TEST SAMPLES GENERATOR   ")
    print("==================================================")

    if not check_backend():
        log("Backend microservices are not reachable. Please make sure they are running!", False)
        return

    # 1. Create a Test Student
    student_payload = {
        "name": "Alex Mercer",
        "email": "alex.mercer@xebia.com",
        "role": "student",
        "department": "Engineering",
        "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"
    }
    
    # Check if student exists or create
    users = requests.get(f"{USER_SERVICE}/users").json()
    student = next((u for u in users if u["email"] == student_payload["email"]), None)
    
    if not student:
        student = requests.post(f"{USER_SERVICE}/users", json=student_payload).json()
        log(f"Created student user: {student['name']} ({student['id']})")
    else:
        log(f"Student user already exists: {student['name']} ({student['id']})")

    # 2. Create a Batch and add the Student to it
    batches = requests.get(f"{BATCH_SERVICE}/batches").json()
    test_batch = next((b for b in batches if b["name"] == "Cloud Native Core"), None)
    
    if not test_batch:
        batch_payload = {
            "name": "Cloud Native Core",
            "description": "Premium training for cloud microservices",
            "students": [student["id"]]
        }
        test_batch = requests.post(f"{BATCH_SERVICE}/batches", json=batch_payload).json()
        log(f"Created batch: {test_batch['name']} ({test_batch['id']})")
    else:
        # Ensure student is in batch
        if student["id"] not in test_batch.get("students", []):
            test_batch["students"].append(student["id"])
            requests.put(f"{BATCH_SERVICE}/batches/{test_batch['id']}", json=test_batch)
            log(f"Added student to existing batch: {test_batch['name']}")
        else:
            log(f"Student already enrolled in batch: {test_batch['name']}")

    # 3. Create Sample MCQ Assessment (100% Auto-graded, Passing limit = 60%)
    mcq_assessment_payload = {
        "title": "Cloud Architecture Core MCQ",
        "description": "Assessment verifying microservice topologies.",
        "instructions": "Answer all questions. Minimum 60% required to pass and earn certificate.",
        "difficulty": "Medium",
        "marks": 20,
        "passingMarks": 60,  # 60%
        "duration": 15,
        "startDate": "2026-07-01",
        "startTime": "09:00",
        "endDate": "2026-12-31",
        "endTime": "23:59",
        "attemptsAllowed": 3,
        "autoGrade": True,
        "manualGrade": False,
        "status": "PUBLISHED",
        "type": "mcq",
        "topic": "Microservices",
        "course": "Cloud Native Architecture",
        "subject": "Cloud Native Architecture",
        "scoreReleasePolicy": "IMMEDIATE_ON_SUBMISSION",
        "certificateEnabled": True,
        "certificateTemplate": "luxury",
        "certificateTitle": "Certified Cloud Microservices Professional",
        "certificateSignatory": "Dr. Arjan van de Ven",
        "certificateSignatoryTitle": "Chief Technology Officer",
        "certificateCorporateLine": "Xebia Global Academy Services",
        "batches": [test_batch["id"]],
        "questions": [
            {
                "questionText": "What does CORS stand for?",
                "options": ["Cross-Origin Resource Sharing", "Centralized Object Routing System", "Client Object Request Source", "Common Object Request Structure"],
                "correctAnswer": "Cross-Origin Resource Sharing",
                "marks": 10.0,
                "evaluationType": "AUTO"
            },
            {
                "questionText": "Which protocol is used by default for inter-service communication in gRPC?",
                "options": ["HTTP/1.1", "HTTP/2", "WebSockets", "TCP Raw"],
                "correctAnswer": "HTTP/2",
                "marks": 10.0,
                "evaluationType": "AUTO"
            }
        ]
    }
    
    assessments = requests.get(f"{ASSESSMENT_SERVICE}/assessments").json()
    mcq_assessment = next((a for a in assessments if a["title"] == mcq_assessment_payload["title"]), None)
    
    if not mcq_assessment:
        mcq_assessment = requests.post(f"{ASSESSMENT_SERVICE}/assessments", json=mcq_assessment_payload).json()
        log(f"Created MCQ assessment: '{mcq_assessment['title']}' ({mcq_assessment['id']})")
    else:
        log(f"MCQ assessment already exists: '{mcq_assessment['title']}' ({mcq_assessment['id']})")

    # Extract real question IDs
    questions = mcq_assessment.get("questions", [])
    if len(questions) < 2:
        log("No questions found in saved assessment!", False)
        return
        
    q1_id = next(q["id"] for q in questions if "CORS" in q.get("questionText", q.get("question", "")))
    q2_id = next(q["id"] for q in questions if "gRPC" in q.get("questionText", q.get("question", "")))

    # 4. Create Passing Submission for the Student -> Should generate Certificate
    submission_pass_payload = {
        "assessmentId": mcq_assessment["id"],
        "studentId": student["id"],
        "studentName": student["name"],
        "status": "submitted",
        "answers": [
            {
                "questionId": q1_id,
                "answer": "Cross-Origin Resource Sharing" # Correct (10 marks)
            },
            {
                "questionId": q2_id,
                "answer": "HTTP/2" # Correct (10 marks)
            }
        ]
    }
    
    sub_pass = requests.post(f"{ASSESSMENT_SERVICE}/submissions", json=submission_pass_payload).json()
    log(f"Submitted PASSING attempt. Percentage: {sub_pass.get('percentage')}%")
    
    # 5. Create Failing Submission for the Student -> Should NOT generate Certificate
    submission_fail_payload = {
        "assessmentId": mcq_assessment["id"],
        "studentId": student["id"],
        "studentName": student["name"],
        "status": "submitted",
        "answers": [
            {
                "questionId": q1_id,
                "answer": "Centralized Object Routing System" # Incorrect (0 marks)
            },
            {
                "questionId": q2_id,
                "answer": "HTTP/1.1" # Incorrect (0 marks)
            }
        ]
    }
    sub_fail = requests.post(f"{ASSESSMENT_SERVICE}/submissions", json=submission_fail_payload).json()
    log(f"Submitted FAILING attempt. Percentage: {sub_fail.get('percentage')}%")

    # 6. Verify Certificate Database Generation
    time.sleep(3) # wait briefly for async grading context
    certs = requests.get(f"{ASSESSMENT_SERVICE}/certificates/user/{student['id']}").json()
    
    log("==================================================")
    log(f"Verification Results for Student {student['name']}:")
    log(f"Total Certificates Earned: {len(certs)}")
    for c in certs:
        log(f"  - Certificate UUID: {c['certificateUuid']} | Serial: {c['serialNumber']} | Score: {c['finalScore']}%")
    
    print("\nLog in as Student:")
    print("Use Email: alex.mercer@xebia.com to test dashboard certificate viewing and PDF downloading.")
    print("==================================================")

if __name__ == "__main__":
    main()
