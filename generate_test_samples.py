import requests
import json
import time

API_GATEWAY = "http://localhost:8080/api/v1"

def log(msg, success=True):
    prefix = "[✔] " if success else "[✖] "
    print(f"{prefix}{msg}")

def check_backend():
    try:
        res = requests.get(f"{API_GATEWAY}/users", timeout=2.0)
        return res.status_code == 200
    except Exception:
        return False

def main():
    print("==================================================")
    print("   XEBIA LMS CERTIFICATE TEST SAMPLES GENERATOR   ")
    print("==================================================")

    if not check_backend():
        log("API Gateway is not reachable on port 8080. Please make sure the backend services are running!", False)
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
    users = requests.get(f"{API_GATEWAY}/users").json()
    student = next((u for u in users if u["email"] == student_payload["email"]), None)
    
    if not student:
        student = requests.post(f"{API_GATEWAY}/users", json=student_payload).json()
        log(f"Created student user: {student['name']} ({student['id']})")
    else:
        log(f"Student user already exists: {student['name']} ({student['id']})")

    # 2. Create a Batch and add the Student to it
    batches = requests.get(f"{API_GATEWAY}/batches").json()
    test_batch = next((b for b in batches if b["name"] == "Cloud Native Core"), None)
    
    if not test_batch:
        batch_payload = {
            "name": "Cloud Native Core",
            "description": "Premium training for cloud microservices",
            "students": [student["id"]]
        }
        test_batch = requests.post(f"{API_GATEWAY}/batches", json=batch_payload).json()
        log(f"Created batch: {test_batch['name']} ({test_batch['id']})")
    else:
        # Ensure student is in batch
        if student["id"] not in test_batch.get("students", []):
            test_batch["students"].append(student["id"])
            requests.put(f"{API_GATEWAY}/batches/{test_batch['id']}", json=test_batch)
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
                "id": "q-mcq-1",
                "questionText": "What does CORS stand for?",
                "options": ["Cross-Origin Resource Sharing", "Centralized Object Routing System", "Client Object Request Source", "Common Object Request Structure"],
                "correctAnswer": "Cross-Origin Resource Sharing",
                "marks": 10.0,
                "evaluationType": "AUTO"
            },
            {
                "id": "q-mcq-2",
                "questionText": "Which protocol is used by default for inter-service communication in gRPC?",
                "options": ["HTTP/1.1", "HTTP/2", "WebSockets", "TCP Raw"],
                "correctAnswer": "HTTP/2",
                "marks": 10.0,
                "evaluationType": "AUTO"
            }
        ]
    }
    
    assessments = requests.get(f"{API_GATEWAY}/assessments").json()
    mcq_assessment = next((a for a in assessments if a["title"] == mcq_assessment_payload["title"]), None)
    
    if not mcq_assessment:
        mcq_assessment = requests.post(f"{API_GATEWAY}/assessments", json=mcq_assessment_payload).json()
        log(f"Created MCQ assessment: '{mcq_assessment['title']}' ({mcq_assessment['id']})")
    else:
        log(f"MCQ assessment already exists: '{mcq_assessment['title']}' ({mcq_assessment['id']})")

    # 4. Create Passing Submission for the Student -> Should generate Certificate
    submission_pass_payload = {
        "assessmentId": mcq_assessment["id"],
        "studentId": student["id"],
        "studentName": student["name"],
        "status": "submitted",
        "answers": [
            {
                "questionId": "q-mcq-1",
                "answer": "Cross-Origin Resource Sharing" # Correct (10 marks)
            },
            {
                "questionId": "q-mcq-2",
                "answer": "HTTP/2" # Correct (10 marks)
            }
        ]
    }
    
    # We create a new submission
    sub_pass = requests.post(f"{API_GATEWAY}/submissions", json=submission_pass_payload).json()
    log(f"Submitted PASSING attempt. Percentage: {sub_pass.get('percentage')}%")
    
    # 5. Create Failing Submission for the Student -> Should NOT generate Certificate
    submission_fail_payload = {
        "assessmentId": mcq_assessment["id"],
        "studentId": student["id"],
        "studentName": student["name"],
        "status": "submitted",
        "answers": [
            {
                "questionId": "q-mcq-1",
                "answer": "Centralized Object Routing System" # Incorrect (0 marks)
            },
            {
                "questionId": "q-mcq-2",
                "answer": "HTTP/1.1" # Incorrect (0 marks)
            }
        ]
    }
    sub_fail = requests.post(f"{API_GATEWAY}/submissions", json=submission_fail_payload).json()
    log(f"Submitted FAILING attempt. Percentage: {sub_fail.get('percentage')}%")

    # 6. Verify Certificate Database Generation
    time.sleep(1) # wait briefly
    certs = requests.get(f"{API_GATEWAY}/certificates/user/{student['id']}").json()
    
    log("==================================================")
    log(f"Verification Results for Student {student['name']}:")
    log(f"Total Certificates Earned: {len(certs)}")
    for c in certs:
        log(f"  - Certificate UUID: {c['certificateUuid']} | Serial: {c['serialNumber']} | Score: {c['finalScore']}%")
    
    print("\n💡 Log in as Student:")
    print(f"👉 Use Email: alex.mercer@xebia.com to test dashboard certificate viewing and PDF downloading.")
    print("==================================================")

if __name__ == "__main__":
    main()
