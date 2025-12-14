using Application.Interfaces;
using Domain.Entities;
using System.Text.Json;
using System.Text.Json.Serialization; // [NEW] Thêm namespace này

namespace Application.Features.Contracts.Commands.UpdateContract
{
    public class UpdateContractHandler
    {
        private readonly IContractRepository _contractRepository;
        private readonly IContractHistoryRepository _contractHistoryRepository;

        public UpdateContractHandler(
            IContractRepository contractRepository,
            IContractHistoryRepository contractHistoryRepository)
        {
            _contractRepository = contractRepository;
            _contractHistoryRepository = contractHistoryRepository;
        }

        public async Task Handle(UpdateContract request)
        {
            var contractToUpdate = await _contractRepository.GetContractById(request.Id);

            if (contractToUpdate == null)
                throw new Exception($"Contract with id {request.Id} not found");

            // [NEW] Cấu hình để bỏ qua vòng lặp (Circular Reference)
            var jsonOptions = new JsonSerializerOptions
            {
                ReferenceHandler = ReferenceHandler.IgnoreCycles,
                WriteIndented = false // Tùy chọn: false để tiết kiệm dung lượng DB
            };

            // 🔥 Serialize old object với options mới
            var oldValue = JsonSerializer.Serialize(contractToUpdate, jsonOptions);

            // 🔥 Map thủ công
            contractToUpdate.FirstName = request.FirstName;
            contractToUpdate.LastName = request.LastName;
            contractToUpdate.Email = request.Email;
            contractToUpdate.Phone = request.Phone;
            contractToUpdate.StartDate = request.StartDate;
            contractToUpdate.EndDate = request.EndDate;
            contractToUpdate.CompanyName = request.CompanyName;
            contractToUpdate.BankAccountNumber = request.BankAccountNumber;
            contractToUpdate.PdfLink = request.PdfLink;
            contractToUpdate.ResellerId = request.ResellerId;
            contractToUpdate.AddressId = request.AddressId;

            await _contractRepository.UpdateContract(contractToUpdate);

            // 🔥 Serialize new object với options mới
            var newValue = JsonSerializer.Serialize(contractToUpdate, jsonOptions);

            // 🔥 Ghi lịch sử
            var history = new ContractHistory
            {
                OldValue = oldValue,
                NewValue = newValue,
                Timestamp = DateTime.UtcNow,
                ContractId = contractToUpdate.Id
            };

            await _contractHistoryRepository.AddAsync(history);
        }
    }
}
