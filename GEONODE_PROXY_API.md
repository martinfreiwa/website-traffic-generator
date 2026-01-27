# Geonode Proxy API Documentation

This documentation provides an overview of the Geonode Proxy API, including authentication, available targeting options, and session management.

## 1. Introduction & Authentication
The Geonode Proxy API uses **Basic Authentication**. You must include your proxy credentials in the `Authorization` header as a Base64-encoded string (`username:password`).

*   **API Protocol:** HTTP/HTTPS and SOCKS5.
*   **Authentication Format:** `-u geonode_username:password`

### Prerequisites
*   **API Credentials:** Basic Authentication (Base64-encoded string).
*   **Service Name:** Indicate which specific service plan or tier you're using (e.g., `RESIDENTIAL-PREMIUM`).

---

## 2. Available Geo-Locations
Retrieve available targeting options (countries, cities, states, and ASNs) to customize your proxy exit nodes.

*   **Endpoint:** `GET https://monitor.geonode.com/services/RESIDENTIAL-PREMIUM/targeting-options`
*   **Response Structure:**
    *   `code`: ISO 3166-1 alpha-2 country code.
    *   `name`: Full country name.
    *   `cities`: City-level targeting options.
    *   `states`: State-level targeting options.
    *   `asns`: ASN-level targeting options.

---

## 3. Sticky Sessions Control
Sticky sessions allow you to maintain a persistent IP address across multiple requests.

### Creating/Connecting to a Sticky Session
To create a session, append a unique session ID to your username string.
*   **Username Format:** `geonode_username-session-randomString`
*   **Sticky Ports:**
    *   **HTTP/HTTPS:** 10000 - 10900
    *   **SOCKS5:** 12000 - 12010

### Configuring Session Lifetime
Control how long an IP remains active (3 to 1440 minutes).
*   **Default:** 10 minutes.
*   **Parameter:** Append `-lifetime-<minutes>` to the username string.

### Bandwidth-Limited Sessions
Control data transfer rates by appending a limit to your credentials.
*   **Username Format:** `geonode_username-session-randomString-limit-<limit>`

---

## 4. Session Management API Reference

### List All Active Sessions
*   **Endpoint:** `GET https://app-api.geonode.com/api/sessions/proxies`
*   **Query Params:** `page` (default 1), `pageSize` (default 250).

### Release Proxy Session by Port
*   **Endpoint:** `PUT https://monitor.geonode.com/sessions/release/proxies`
*   **Body:** 
    ```json
    {
      "data": [
        {
          "port": 10001
        }
      ]
    }
    ```

### Release Sticky Session by Session ID and Port
*   **Endpoint:** `PUT https://monitor.geonode.com/sessions/release/proxies/bulk`
*   **Body:**
    ```json
    {
      "data": [
        {
          "id": "sessionID",
          "port": 10001
        }
      ]
    }
    ```

---

## 5. Usage Statistics
Track your proxy consumption and bandwidth usage.

*   **Endpoint:** `GET https://monitor.geonode.com/services/RESIDENTIAL-PREMIUM/usage`
*   **Details Provided:** Total bandwidth used, session counts, and plan limits.

---

### Error Handling
The API follows standard HTTP status codes:
*   `200 OK`: Success.
*   `401 Unauthorized`: Authentication failed or missing.
*   `403 Forbidden`: Access denied to the requested resource.
*   `404 Not Found`: Resource not found.
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: Server-side issue.
