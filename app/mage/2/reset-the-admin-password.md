---
Reset the admin password
---
In MySQL, do:

```sql
UPDATE admin_user SET password = CONCAT(SHA2('xxxxxxxxNewPassword', 256), ':xxxxxxxx:1') WHERE username = 'ADMINUSERNAME';
```