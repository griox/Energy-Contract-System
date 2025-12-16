using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Api.Common.Messaging.Contracts; // <-- namespace event sau khi bạn đổi theo hướng A

namespace CustomerService.Api.Controllers;

[ApiController]
[Route("api/test-contract-history")]
public class ContractHistoryTestController : ControllerBase
{
    private readonly IPublishEndpoint _publishEndpoint;

    public ContractHistoryTestController(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    [HttpPost("{contractId:int}")]
    public async Task<IActionResult> Test(int contractId)
    {
        await _publishEndpoint.Publish(new ContractChangedEvent
        {
            ContractId = contractId,
            Action = "Updated",
            OldValue = "{\"status\":\"Draft\",\"price\":100}",
            NewValue = "{\"status\":\"Approved\",\"price\":120}",
            Timestamp = DateTime.UtcNow,
            ChangedBy = null,
            CorrelationId = null
        });

        return Ok("published");
    }
}