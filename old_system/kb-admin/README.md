# IB Admin

### Architecture

There are 4 sevices:
1. [admin web application](https://github.com/Kbdev-ibab/kb-admin) - Next.js
2. [user mobile application](https://github.com/Kbdev-ibab/kb-app) - React Native
3. [document processor](https://github.com/Kbdev-ibab/kb-fastapi-document-processor) - Python
4. [embedding service](https://github.com/Kbdev-ibab/kb-fastapi-embedding-service-main) - Python

There are multiple features, but one needs to be explained in details - it is File Uploading:
1. admin uploads file to the Knowledge Base (1st service)
2. file is stored in AWS S3 (1st service)
3. corresponding record is created in the ibben_lena_knowledge_files table (1st service)
4. event is submitted to AWS SQS (1st service)
5. AWS SQS event triggers AWS Lambda (AWS)
6. AWS Lambda sends POST request to 3rd service (AWS)
7. 3rd service processes the file (3rd service)
   1. downloads file from AWS S3
   2. partitions the file
   3. cleanes the file
   4. creates chunks
   5. generates embeddings
   6. indexes chunks in vector store
   7. record status is updated in the ibben_lena_knowledge_files table
8. AWS Lambda removes the event from AWS SQS

_During every sub-step of the step #7, 3rd service updates status of the record in the ibben_lena_knowledge_files table_

### Database

To run migrations:  
`pnpm run migrate`

To generate new migration, after you've applied changes to `src/db/schema.ts` file, run:  
`pnpm run generate`

**If database is empty**, add this object to the beginning of `src/db/drizzle/meta/_journal.json` before running `pnpm run migrate`:
```
{
   "idx": 0,
   "version": "7",
   "when": 1751901367203,
   "tag": "0000_fuzzy_microbe",
   "breakpoints": true
}
```

### TODO:
Beta 1.0.0:
- [x] Add OCR feature to extract text from unstrutured PDF
- [x] Deploy the knowledge-base pipeline to AWS
- [x] App intro chat starters
- [x] Add news filter specific to company
- [x] Setup proper admin auth system
- [x] Fix midleware for protected routes
- [x] Fix edit, update, delete customers in manage customers page
- [x] Add logic for checking existing no of users before changing license count
- [x] Fix breadcrumb to be dynamic
- [x] Add Edit customer 


Beta 1.1.0:
- [ ] Fix swedish characters in new file uploads for knowledge base
- [ ] Fix system prompt to prevent hallucinations, providing sources of information
- [ ] Add notifications to admin when Lena doesnt know the answer
- [ ] Add excel import and export for users (bulk upload, bulk download)
- [x] Add forget password, reset password functionality
- [ ] Add email verification for users, one time code for app sign up
- [x] Add rate limits for chats
- [x] Add education feature, with quiz an tranining completion certificate
- [x] Add RevenueCat for buying full access to all education content
- [x] Add RevenueCat for payments for higher rate limits on chats with Lena
- [ ] Fix edit, update, delete admins in manage admins page
- [ ] sync customer users count with adding/removing users
- [ ] enforce unique email, personal number for licenses
- [ ] add dropdown for selecting customers for news visibility
- [ ] fix llm credits to client control
- [ ] revalidate news list after deleting a news

