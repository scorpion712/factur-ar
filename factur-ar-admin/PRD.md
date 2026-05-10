# PRD — FacturAr Admin

## 1. Project Overview

**Project Name**: FacturAr Admin  
**Type**: Web Application (Admin Dashboard)  
**Stack**: React 19 + Vite + TypeScript  
**Purpose**: Admin panel to manage customers for the ARCA/AFIP invoice generation cloud function

**Context**: The backend is a Firebase Cloud Function that generates electronic invoices (facturas A/B/C, notas de crédito) for multiple POS clients via ARCA/AFIP (Argentine tax authority). This admin web provides a UI to manage those clients/customers.

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US01 | As an admin, I want to log in with email and password so only authorized users can access | HIGH |
| US02 | As an admin, I want to see the list of all customers so I can manage them | HIGH |
| US03 | As an admin, I want to create a new customer with their AFIP credentials so they can generate invoices | HIGH |
| US04 | As an admin, I want to edit customer details so I can update their information | HIGH |
| US05 | As an admin, I want to delete a customer so they can no longer access the system | MEDIUM |
| US06 | As an admin, I want to upload a customer certificate (.crt) so they can authenticate with AFIP | HIGH |
| US07 | As an admin, I want to upload a customer private key (.key) so they can sign invoices | HIGH |
| US08 | As an admin, I want to validate that a customer has a valid payment so they can use the service | MEDIUM |
| US09 | As an admin, I want to see customer status (active/inactive) so I know who can use the system | MEDIUM |

---

## 3. Functional Requirements

### 3.1 Authentication

- **Login Screen**: Email + Password fields
- **Password Requirements**:
  - Minimum 6 characters, maximum 8 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 special character (-, !, @, #, etc.)
  - At least 1 number (0-9)
- **Session**: Simple session management (localStorage token)
- **Logout**: Button to end session

### 3.2 Customer Management

#### Customer List
- Display table with columns: Company Name, CUIT, Point of Sale, IVA Condition, Status, Actions
- Search by company name or CUIT
- Filter by status (active/inactive)
- Pagination (10 per page)

#### Create Customer
- Fields:
  - **Company Name** (Razón Social) - required, text
  - **CUIT** - required, 11 digits
  - **Point of Sale** (Punto de Venta) - required, number (1-9999)
  - **IVA Condition** (Condición IVA) - required, dropdown:
    - Responsable Inscripto
    - Monotributista
    - Exento
    - Consumidor Final
  - **Access Token** (AFIP Access Token) - required, text
  - **Certificate** (.crt file) - required, file upload
  - **Private Key** (.key file) - required, file upload
  - **Active** - checkbox, default true

#### Edit Customer
- All fields from Create Customer
- Cannot change CUIT (primary identifier)
- Can re-upload certificate/key files

#### Delete Customer
- Confirmation modal before deletion
- Soft delete (mark as inactive) or hard delete

### 3.3 Certificate Management

- File upload for .crt and .key files
- Display current certificate expiration date (if parseable)
- Show file name of uploaded certificate
- Validate file format (PEM format for .crt/.key)

### 3.4 Payment Validation

- Add "Payment Valid" flag to customer
- Display payment status in customer list
- Filter by payment status
- Date of last payment validation

---

## 4. Data Model (Customer)

```typescript
interface Customer {
  id: string;                    // Unique ID (clientId)
  razonSocial: string;          // Company name
  CUIT: string;                 // Tax ID (11 digits)
  puntoVenta: number;            // Point of sale
  condicionIva: string;          // IVA condition
  certificate: string;          // Encrypted certificate (PEM)
  privateKey: string;           // Encrypted private key (PEM)
  accessToken: string;           // AFIP access token
  active: boolean;              // Is customer active
  paymentValid: boolean;        // Is payment validated
  lastPaymentCheck?: Date;      // Last payment validation date
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

---

## 5. UI/UX Requirements

### 5.1 Design Philosophy

- **Minimalist**: Remove all unnecessary elements
- **Modern**: Clean lines, generous whitespace
- **Expressive**: Use typography and subtle interactions to convey meaning
- **Iconless when possible**: Use text labels, not icons, unless absolutely necessary

### 5.2 Typography

- **Font**: Inter (Google Fonts) - clean, professional, modern
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Sizes**:
  - H1: 32px, weight 700
  - H2: 24px, weight 600
  - H3: 18px, weight 600
  - Body: 14px, weight 400
  - Small: 12px, weight 400

### 5.3 Color Palette

- **Background**: #FAFAFA (off-white)
- **Surface**: #FFFFFF (white cards)
- **Primary**: #1A1A1A (near black)
- **Secondary**: #6B7280 (gray-500)
- **Accent**: #2563EB (blue-600) - for interactive elements
- **Success**: #059669 (green-600)
- **Warning**: #D97706 (amber-600)
- **Error**: #DC2626 (red-600)
- **Border**: #E5E7EB (gray-200)

### 5.4 Layout

- **Container**: Max-width 1200px, centered
- **Spacing**: 8px base unit (8, 16, 24, 32, 48)
- **Border Radius**: 8px for cards, 6px for inputs, 4px for buttons
- **Shadows**: Subtle, e.g., `0 1px 3px rgba(0,0,0,0.1)`

### 5.5 Components

#### Login Page
- Centered card on gradient background
- Email input with label
- Password input with label and show/hide toggle
- "Login" button (full width)
- Password requirements hint below password field

#### Dashboard (Customer List)
- Header with title "Customers" and "Add Customer" button
- Search input (full width or partial)
- Filter dropdown (status)
- Table with customer data
- Pagination controls

#### Customer Form (Create/Edit)
- Modal or separate page
- Form fields with labels
- File upload areas with drag-drop support
- Save and Cancel buttons

#### Confirmation Modal
- Centered overlay
- Title, message, Confirm/Cancel buttons

### 5.6 Interactions

- **Hover**: Subtle background color change, no major transformations
- **Focus**: Blue outline ring
- **Loading**: Skeleton or spinner (minimal)
- **Empty States**: Friendly message with call to action
- **Errors**: Red text below field, red border on field

---

## 6. Non-Functional Requirements

### 6.1 Security

- Password validation as specified
- Session token in localStorage (simple auth for now)
- No sensitive data in URL params

### 6.2 Performance

- Fast initial load (< 2s)
- Responsive (works on desktop and tablet)

### 6.3 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 7. Out of Scope (for now)

- User management (admin users)
- Actual AFIP API integration (this is admin only, backend handles AFIP)
- Detailed invoice history
- Rate limiting UI
- Multi-admin with roles

---

## 8. Future Enhancements

- Payment integration (Stripe, MercadoPago)
- Certificate expiration alerts
- Invoice generation dashboard
- Customer usage statistics
- Export to CSV/Excel

---

## 9. Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|---------------------|
| Login | Can log in with valid credentials; shows error for invalid password format |
| Password Validation | Rejects passwords that don't meet all requirements |
| Customer List | Shows all customers with search and filter working |
| Create Customer | Can create customer with all required fields |
| Edit Customer | Can edit and save changes |
| Delete Customer | Shows confirmation, removes customer |
| File Upload | Can upload .crt and .key files, shows file name |
| Payment Validation | Can toggle payment valid status |

---

## 10. Technical Notes

- Use React 19 with Vite
- Use React Router for navigation
- Use Zustand for state management
- Use React Hook Form for form handling
- Use Zod for validation
- CSS: Plain CSS with CSS variables (no Tailwind)
- Mock data for now (no backend connection)
- TypeScript strict mode