# 🔐 VendorVerify – Smart QR Authentication System

![Frontend](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)
![Deployment](https://img.shields.io/badge/Deployed%20On-Vercel-black?logo=vercel)

VendorVerify is a smart and secure QR-based product authentication system designed to prevent counterfeit products and improve trust in the supply chain. The system enables vendors to generate QR codes, verifiers to authenticate products in real time, and administrators to monitor activity through detailed audit logs.

---

## 🎯 Project Overview

Counterfeit products are a major challenge for brands and consumers. VendorVerify solves this problem by providing a QR-driven authentication mechanism with role-based access control and complete audit tracking.

### 👥 User Roles
- **Vendor** – Registers products and generates secure QR codes  
- **Verifier** – Scans QR codes to verify product authenticity  
- **Admin** – Manages users, monitors scan history, and handles security alerts  

Each QR scan records verification result, IP address, and location to ensure transparency.

---

## 🚀 Live Deployment

🔗 **Application URL:**  
[https://vendorverify-authentication.vercel.app/](https://vendorverify-authentication.vercel.app/)

---

## ✅ Features

### 🏭 Vendor Features
- Product registration with unique serial numbers  
- Secure QR code generation (hashed tokens)  
- View recent products and scan history  
- Receive security alerts from admin  

### 🔍 Verifier Features
- Scan QR codes for instant verification  
- View authenticity status (valid / invalid / used)  
- Automatic logging of IP address and location  
- Access personal scan history  

### 🧑‍💼 Admin Features
- Manage vendors and verifiers  
- View all products and scan history  
- Temporarily ban or unban users  
- Generate and manage security alerts  

### 🛡️ Security
- Hashed QR data storage  
- Role-based access control (RLS)  
- Immutable audit logs  
- Server-side IP and location tracking  

---

## 🧰 Tech Stack

| Layer | Technology |
|-----|-----------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js (REST APIs) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Deployment | Vercel |
| Tools | VS Code, GitHub, Postman |

---

## 🏗️ System Architecture

- React frontend communicates with Node.js backend APIs  
- Backend handles authentication, QR generation, verification, and logging  
- Supabase manages authentication, database, and Row Level Security  
- IP-based location is resolved server-side using ipapi  

---

## 🧪 Testing

- Functional testing of authentication, QR generation, and verification  
- Role-based access testing for vendors, verifiers, and admins  
- Supabase RLS policy testing  
- Manual testing for edge cases (invalid or reused QR codes)  

---

## 📌 Limitations

- Designed for internship and demonstration purposes  
- IP-based geolocation may not always be precise  
- Offline QR verification is not supported  
- Advanced fraud analytics not implemented  

---

## 🔮 Future Enhancements

- Mobile application for QR scanning  
- Advanced fraud detection and anomaly analysis  
- Email/SMS notifications for security alerts  
- Multi-language support  
- Analytics dashboards for vendors and admins  

---

## 🎓 Learning Outcomes

- Full-stack web development with React.js and Node.js  
- Secure database design using Supabase and PostgreSQL  
- Role-based authentication and authorization  
- Audit logging and security-focused design  
- Cloud deployment using Vercel  

---

## 📞 Support

For issues, questions, or contributions:
- Create an issue in the repository
- Contact: sagardatkhile.official@gmail.com
- LinkedIn: https://www.linkedin.com/in/sagar-datkhile/

---

## 📄 License

This project is created for educational purposes. Feel free to use, modify, and distribute as needed.

---

⭐ If you found this project useful, consider starring the repository!

**Verify Products. Prevent Counterfeits. Build Trust.**
