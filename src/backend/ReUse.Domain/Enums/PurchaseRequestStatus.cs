namespace ReUse.Domain.Enums;

public enum PurchaseRequestStatus
{
    Pending = 0,   // Initial state when buyer sends request
    Accepted = 1,  // Seller accepts the request
    Rejected = 2,  // Seller rejects the request
    Cancelled = 3, // Buyer cancels the request before seller responds
}