---
Reset the admin password
---
In MySQL, do:

```sql
UPDATE admin_user SET password = CONCAT(MD5('xxNewPassword'), ':xx') WHERE username = ‘ADMINUSERNAME’;
```