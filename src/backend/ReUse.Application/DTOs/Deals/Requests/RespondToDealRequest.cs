namespace ReUse.Application.DTOs.Deals.Requests;

public class RespondToDealRequest
{
    /// <summary>Accept or Reject</summary>
    public DealAction Action { get; set; }
}

public enum DealAction
{
    Accept,
    Reject
}