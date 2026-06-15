using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Reports;
using ReUse.Application.Enums;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ReportService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    #region CREATE
    public async Task<ReportDetailsResponse> CreateAsync(Guid reporterUserId, CreateReportRequest request)
    {
        var reporter = await _unitOfWork.User.GetByIdAsync(reporterUserId)
            ?? throw new UnauthorizedException();

        if (!reporter.IsActive)
            throw new ForbiddenException("Your account is deactivated.");

        await ValidateTargetExistsAsync(request.TargetType, request.TargetId);

        if (request.TargetType == ReportTargetType.User && request.TargetId == reporterUserId)
            throw new BadRequestException("You cannot report yourself.");

        var alreadyReported = await _unitOfWork.Reports.ExistsByReporterAsync(
            reporterUserId, request.TargetType, request.TargetId);

        if (alreadyReported)
            throw new ConflictException("Report");

        var report = new Report
        {
            ReporterUserId = reporterUserId,
            TargetType = request.TargetType,
            TargetId = request.TargetId,
            Reason = request.Reason,
            Notes = request.Notes,
            Status = ReportStatus.Pending
        };

        await _unitOfWork.Reports.AddReportAsync(report);


        var saved = await _unitOfWork.Reports.GetByIdWithDetailsAsync(report.Id)
            ?? throw new NotFoundException("Report");

        return await MapReportDetailsAsync(saved);
    }
    #endregion

    #region GET by id
    public async Task<ReportDetailsResponse> GetByIdAsync(Guid reportId)
    {
        var report = await _unitOfWork.Reports.GetByIdWithDetailsAsync(reportId)
            ?? throw new NotFoundException("Report");

        return await MapReportDetailsAsync(report);
    }
    #endregion

    #region GET all (admin)
    public async Task<PagedResult<AdminReportListResponse>> GetAllAsync(AdminReportFilterParams filterParams)
    {
        var paged = await _unitOfWork.Reports.GetAllAsync(filterParams.Status, filterParams.TargetType, filterParams.ReporterUserId, filterParams.CreatedFrom, filterParams.CreatedTo, filterParams.Pagination, filterParams.SortDirection);
        return new PagedResult<AdminReportListResponse>
        {
            Data = _mapper.Map<List<AdminReportListResponse>>(paged.Data),
            PageNumber = paged.PageNumber,
            PageSize = paged.PageSize,
            TotalRecords = paged.TotalRecords
        };
    }
    #endregion

    #region GET by reporter
    public async Task<PagedResult<ReportResponse>> GetByReporterAsync(
        Guid reporterUserId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc)
    {
        var reporter = await _unitOfWork.User.GetByIdAsync(reporterUserId)
            ?? throw new UnauthorizedException();

        var paged = await _unitOfWork.Reports.GetByReporterAsync(reporterUserId, pagination, sortDirection);

        return new PagedResult<ReportResponse>
        {
            Data = _mapper.Map<List<ReportResponse>>(paged.Data),
            PageNumber = paged.PageNumber,
            PageSize = paged.PageSize,
            TotalRecords = paged.TotalRecords
        };
    }
    #endregion

    #region REVIEW
    public async Task<ReportDetailsResponse> ReviewAsync(Guid reportId, Guid reviewerUserId, ReviewReportRequest request)
    {
        _ = await _unitOfWork.User.GetByIdAsync(reviewerUserId)
            ?? throw new UnauthorizedException();

        var report = await _unitOfWork.Reports.GetByIdWithDetailsAsync(reportId)
            ?? throw new NotFoundException("Report");

        report.Status = request.Status;
        report.ReviewedByUserId = reviewerUserId;
        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewNotes = request.ReviewNotes;

        _unitOfWork.Reports.Update(report);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.Reports.GetByIdWithDetailsAsync(reportId)
            ?? throw new NotFoundException("Report");

        return await MapReportDetailsAsync(updated);
    }
    #endregion

    #region Helpers
    private async Task<ReportDetailsResponse> MapReportDetailsAsync(Report report)
    {
        var response = _mapper.Map<ReportDetailsResponse>(report);

        if (report.TargetType == ReportTargetType.Comment)
        {
            var comment = await _unitOfWork.Comments.GetCommentWithAuthorAsync(report.TargetId);
            if (comment is not null)
            {
                response = response with { TargetCommentBody = comment.Body };
            }
        }

        return response;
    }

    private async Task ValidateTargetExistsAsync(ReportTargetType targetType, Guid targetId)
    {
        switch (targetType)
        {
            case ReportTargetType.Product:
                var product = await _unitOfWork.Product.GetByIdAsync(targetId);
                if (product is null || product.Status == ProductStatus.Deleted)
                    throw new NotFoundException("Product");
                break;

            case ReportTargetType.Comment:
                var comment = await _unitOfWork.Comments.GetCommentWithAuthorAsync(targetId);
                if (comment is null || comment.IsDeleted)
                    throw new NotFoundException("Comment");
                break;

            case ReportTargetType.User:
                var user = await _unitOfWork.User.GetByIdAsync(targetId);
                if (user is null)
                    throw new NotFoundException("User");
                break;

            default:
                throw new BadRequestException("Invalid report target type.");
        }
    }
    #endregion
}