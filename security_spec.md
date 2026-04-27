# Security Specification (Attendly)

## Data Invariants
1. A **User** profile must exist for any authenticated user performing lecture tasks.
2. A **Lecture** must belong to an **Instructor**.
3. **Attendance** records must be tied to a valid **Lecture** and a valid **Student**.
4. Students can only create attendance for lectures that are currently ongoing (verified by time, though rules mostly check IDs).
5. Only **Instructors** can create/delete lectures.
6. **Users** can only read their own private profile data (PII).

## The Dirty Dozen Payloads (Targeting users/lectures/attendance)

1. **Identity Spoofing**: `CREATE /users/hacker-id { "uid": "victim-id", "role": "instructor" }` -> Should fail (isOwner mismatch).
2. **Role Escalation**: `UPDATE /users/my-id { "role": "instructor" }` -> Should fail (role is immutable for students, or requires admin).
3. **Ghost Fields**: `CREATE /lectures/123 { ..., "isVerified": true }` -> Should fail (`isValidLecture` size/key check).
4. **Foreign Project Hijack**: `CREATE /lectures/123 { "instructorId": "victim-id", ... }` -> Should fail (instructorId mismatch).
5. **ID Poisoning**: `GET /users/very-long-id-string-exceeding-128-chars` -> Should fail (`isValidId`).
6. **Orphaned Attendance**: `CREATE /lectures/non-existent/attendance/me { ... }` -> Should fail (`get` parent check).
7. **Cross-User Snooping**: `GET /users/victim-id` -> Should fail (PII Isolation: only own or student-instructor relation).
8. **Temporal Integrity Breach**: `CREATE /attendance/me { "timestamp": "2000-01-01" }` -> Should fail (server timestamp mismatch).
9. **State Locking Bypass**: `UPDATE /attendance/me { "status": "present" }` where `status` is already `late`. -> Should fail (affectedKeys).
10. **Query Scraping**: `LIST /users` -> Should fail (No blanket list).
11. **Resource Poisoning**: `CREATE /lectures/123 { "name": "A" * 1001 }` -> Should fail (size check).
12. **Anonymous Write**: `CREATE /users/123` with `auth == null` -> Should fail (`isSignedIn`).
