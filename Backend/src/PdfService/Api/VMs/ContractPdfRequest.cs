using System;
using System.Collections.Generic;

namespace Api.VMs;

public class ContractPdfRequest
{
    public int ContractId { get; set; } 
    public string ContractNumber { get; set; } = string.Empty;

    // --- Thông tin khách hàng ---
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string AddressLine { get; set; } = string.Empty;

    // --- Thông tin hợp đồng ---
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "VND";

    // --- Cấu hình PDF ---
    public string? TemplateName { get; set; } 
    public string? CurrentPdfUrl { get; set; } 

    // --- QUAN TRỌNG: Thêm danh sách Orders để sửa lỗi ---
    public List<OrderPdfDto> Orders { get; set; } = new List<OrderPdfDto>();
}

// Class DTO dùng để hiển thị từng dòng trong bảng Order
public class OrderPdfDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public int OrderType { get; set; } // Ví dụ: 1 = Gas, 2 = Electricity
    public int Status { get; set; }    // Ví dụ: 1 = Active, 0 = Pending
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TopupFee { get; set; }
}