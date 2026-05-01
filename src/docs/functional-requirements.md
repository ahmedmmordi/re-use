## 3. Functional Requirements
### 1. User Management
**FR-1** The system shall allow users to **register, log in, and log out** using email, phone number, or third-party services (e.g., Google, Facebook).  
**FR-2** The system shall validate **email or phone verification** during registration.  
**FR-3** User passwords shall be **hashed and securely stored**.
**FR-4** The system shall support **password recovery** via email or phone (e.g., password reset links or verification codes).
==**FR-5** The system shall allow users to **enable Two-Factor Authentication (2FA)** for enhanced account security (via email, SMS).==
**FR-6** During registration, the system shall collect **user details** such as full name, address, and contact information.
**FR-7** The system shall allow users to **view and edit their profiles**, including name, profile picture, bio, contact information, and location.
**FR-8** The system shall support three main user roles**:
- **Admin** – has full access to manage users, content, and system settings.
- **Manager** - Make query and generate reports
- **User** – can act as both a **buyer** and a **seller** within the system.
  **FR-9** The system shall allow users to **deactivate or permanently delete** their accounts. When an account is deleted, all personal data must be removed in compliance with data protection regulations.
  **FR-10** Users shall be able to **follow or unfollow** another user

### 2. Product Management
**FR-10** The system shall allow users to **create, edit, and delete product listings** of the following types:
- **Regular**
- **Wanted**
- **Swap**
  **FR-11** Each product shall include one of the following **conditions**:
- **New**
- **Like New**
- **Used**
- **Broken**
  **FR-12** The system shall clearly display the **product type** and **condition** in all product listings and product detail pages.
  ***FR-14** The system shall allow users to **save or favorite** products for later viewing.*
  **FR-15** The system shall allow users to **comment** on product.
  **FR-17** The system shall **validate all product data** before publishing (e.g., non-empty title, valid category, and at least one image).
  **FR-18** The system shall support **pagination or infinite scrolling** for product listings.
  **FR-19** product can be premium ==(What's premium do)==
#### 2.1 Regular Products
**FR-19** A **Regular Product** shall have a **fixed price** set by the seller.  
**FR-20** Buyers can directly **purchase or contact the seller** to negotiate.

#### 2.3 Wanted Products
**FR-28** Users shall be able to post **“Wanted” listings** for products they are searching for, optionally including a **desired price range** and description.  
**FR-29** The system shall **notify sellers** who have similar items listed that match the “Wanted” product details.

#### 2.3 Swap Products
**FR-30** The system shall allow users to **create “Swap” listings**, specifying:
- The item they are **offering (Item Y)**
- The item they **want in exchange (Item X)**
  **FR-31** The system shall **notify users** who own Item X or are interested in similar items that a potential swap opportunity exists.

### 3. Category Management
**FR-32** The system shall organize all products under predefined **categories** and **subcategories** to ensure structured browsing and searching.  
**FR-33** The system shall allow **admins** to **create, edit, deactivate, or delete** categories and subcategories.  
**FR-34** Each category shall include:
- A **unique name**
- An optional **description**  
  **FR-35** The system shall allow users to **browse, filter, and search** products by category and subcategory.  
  **FR-36** The system shall allow users to **follow one or more categories** to receive personalized updates and recommendations.  
  **FR-37** The system shall **notify users** when **new products** are added to categories they follow (daily).  
  **FR-38** The system shall maintain **category-product relationships**, ensuring that deleting or deactivating a category does not cause data loss (e.g., products are reassigned to “Uncategorized”).

### 4. Favorites & Activity
**FR-40** Users shall be able to **add or remove products** from their favorites list with a single action.   
**FR-43** Users shall be able to **revisit previously viewed products** or **restore old searches** from their activity history.


### 5. Search & Filtering & sorting
#### 5.1 Search
**FR-52** The system shall allow users to **search products** using keywords that match product titles, descriptions, categories, seller names , etc.
**==FR-53==** The system shall support **autocomplete suggestions** while the user types, showing matching keywords, categories, and products. (==search==)
**FR-54** The system shall support **typo-tolerant search** (e.g., suggesting “iPhone” when the user types “iphon”).
**FR-55** The system shall **store user search history** to improve personalized recommendations and enable quick access to recent searches.
**FR-56** The system shall allow users to **clear their search history** at any time.
FR-58 The system shall support voice search input on supported devices.
FR-59 The system shall rank search results based on relevance, popularity, and recency.

#### 5.2 Filtering
**FR-58** The system shall allow users to **filter search results or category listings** based on multiple criteria, including (but not limited to):
- Location
- Price range
- Product status (New, Used, Like New, Broken)
- Product type (Regular, Auction, Wanted, Swap)
- Shipping availability
- Seller rating
- Category or subcategory
  **FR-59** Users shall be able to **apply multiple filters simultaneously** to refine search results.
  **FR-60** The system shall allow users to **save filter configurations** for future reuse (e.g., “Phones under $200 in Cairo”).
  **FR-61** The system shall **notify users** when new products match their saved filter criteria.
#### 5.3 sorting
**FR-62** The system shall allow users to **sort products** using multiple criteria, such as:
- Newest first
- Lowest price
- Highest price
- Ending soon (for auctions)
  **FR-63** The system shall **prioritize or boost “Premium” products** to appear at the top of search and listing results.

### 6. Notifications
**FR-64** The system shall include a centralized **Notification Center** where users can view and manage all notifications related to:
- Chats and messages "real time"
- Admin announcements and actions
- System updates and security alerts
  **FR-65** The system shall deliver notifications through multiple channels:
- **Email notifications**
- **Push notifications** (browser)
  **FR-66** Users shall be able to **customize their notification preferences**, choosing which types of notifications to receive and by which channels (email, push, in-app, or all).
  **FR-67** The system shall display a **notification icon with an unread counter** in the user interface.
  **FR-68** Notifications shall have **read/unread statuses**, and users shall be able to **mark all as read** or clear them individually.
  **FR-69** Notifications shall be **time-stamped** and sorted by most recent activity.
  **FR-71** The system shall **automatically delete or archive old notifications** after a configurable period (e.g., 90 days).
  **FR-72** The system shall **store notification logs** for auditing and troubleshooting (visible to admins).
  **FR-73** Admin users shall be able to **send broadcast notifications** to all users or targeted groups (e.g., for promotions, policy updates, or maintenance alerts).

### 7. Chat System
**FR-170** The system shall include a **real-time chat** feature that enables **secure and instant communication** between buyers and sellers.
**FR-171** The chat system shall support sending and receiving of **text, images, and product links/previews**.
**FR-172** The system shall display **read receipts**, **message timestamps**, and **online/offline status** of participants.
**FR-173** The chat shall be **contextual**, meaning each chat is tied to a specific product or transaction when initiated from a listing or order.
**FR-174** The system shall send **instant in-app and push notifications** for new messages, message replies, and attachments.
**FR-175** The chat shall support **typing indicators** to show when the other user is composing a message.
**FR-176** The system shall allow users to **block, mute** other users for spam or inappropriate behavior.
**FR-178** The chat shall be **end-to-end encrypted**, ensuring only the sender and receiver can read the messages.
**FR-179** The system shall store chat history securely and allow users to **view past conversations** within their account.
**FR-180** The system shall support **message deletion** by users, with clear visibility (e.g., “message deleted” label).
**FR-184** The system shall **archive or auto-close** inactive chats after a configurable period (e.g., 30 days of inactivity).
**FR-187** The system shall provide **delivery indicators** (sent, delivered, read) for message reliability.
**FR-188** The chat system shall handle **network interruptions gracefully**, automatically resending unsent messages when connectivity is restored.
**FR-189** The system shall support **emoji and basic text formatting** for better communication.
**FR-191** For privacy, users shall be able to **delete entire conversations** from their chat list, without affecting the other party’s copy.

### 8. Admin Dashboard
FR00: CRUD Users, products, categories
FR00: block user
FR00: notification broadcast
FR00: Logs
FR00: promotion products
FR00: Queries
FR00: Managers with lower permissions

### 9. Shipping
### 10. Payments & Escrow
FR00 integrate with payment getaway
FR00 when user need make the product is premium system use this payment to take money  
**FR-88** The system shall support **secure online payments** within the application for all eligible transactions.  
**FR-89** The system shall integrate with one or more **payment gateways** (e.g., Stripe, PayPal, Paymob, Fawry) to process payments securely.  
**FR-90** All **payment data** (e.g., card details, transaction IDs) shall be **encrypted and tokenized** to comply with PCI DSS standards.  
**FR-91** The system shall include an **escrow mechanism** that holds buyer payments until one of the following conditions is met:
- The buyer **confirms receipt** of the product and marks the order as “Done.”
- The **dispute resolution period** expires without any issues reported.  
  **FR-92** Once escrow conditions are met, the system shall **release funds automatically** to the seller’s account or wallet.  
  **FR-93** The system shall **record and log all payment transactions**, including timestamps, amounts, and transaction IDs, for auditing and support purposes.  
  **FR-94** The system shall notify both the **buyer and seller** upon successful payment, escrow release, or refund.  
  **FR-95** The system shall provide **admins** with a dashboard to view, approve, or investigate payments and disputes.  
  **FR-96** The system shall automatically **cancel unpaid orders** after a configurable timeout period (e.g., 30 minutes).

### 12. Reviews
**FR-106** The system shall allow users to **rate and review sellers or buyers** after a **confirmed transaction** (e.g., item delivered, service completed).  
**FR-107** Reviews shall include:
- A **1–5 star rating**
- An optional **text comment**
- Optional **images** as proof or illustration of the transaction outcome  
  **FR-108** The system shall **validate that the reviewer participated** in the transaction before allowing feedback submission.  
  **FR-109** Users shall be able to **delete their reviews**.  
  **FR-110** Sellers shall be able to **reply publicly** to reviews, allowing them to clarify misunderstandings or thank buyers.