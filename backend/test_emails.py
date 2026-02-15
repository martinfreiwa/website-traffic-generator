#!/usr/bin/env python3
import os

os.environ["RESEND_API_KEY"] = "re_9RGgxuhM_KLmRkYofRcGnhKgsfddLr3CC"

import email_service

print("Sending test emails to nucularreview@gmail.com...")
print("=" * 50)

# Test 1: Verification Email
print("\n1. Sending verification email...")
result1 = email_service.send_verification_email(
    "nucularreview@gmail.com", "test_verification_token_12345"
)
print(f"Result: {result1}")

# Test 2: Password Reset Email
print("\n2. Sending password reset email...")
result2 = email_service.send_password_reset_email(
    "nucularreview@gmail.com", "test_reset_token_67890"
)
print(f"Result: {result2}")

# Test 3: Welcome Email
print("\n3. Sending welcome email...")
result3 = email_service.send_welcome_email("nucularreview@gmail.com", "Test User")
print(f"Result: {result3}")

# Test 4: Payment Receipt Email
print("\n4. Sending payment receipt email...")
result4 = email_service.send_payment_receipt_email(
    "nucularreview@gmail.com", 49.99, "Pro Plan", "txn_test_123456"
)
print(f"Result: {result4}")

print("\n" + "=" * 50)
print("All test emails sent!")
