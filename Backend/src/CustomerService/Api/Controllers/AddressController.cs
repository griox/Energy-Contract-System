using Application.DTOs;
using Application.Features.Addresses.Commands.CreateAddress;
using Application.Features.Addresses.Commands.GetAllAddresses;
using Application.Features.Addresses.Commands.DeleteAddress;
using Application.Features.Addresses.Commands.UpdateAddress;
using Application.Features.Addresses.Commands.GetAddress;

using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/addresses")]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly CreateAddressHandler _createAddressHandler;
    private readonly GetAllAddressesHandler _getAllAddressesHandler;
    private readonly GetAddressByIdHandler _getAddressByIdHandler;
    private readonly DeleteAddressHandler _deleteAddressHandler;
    private readonly UpdateAddressHandler  _updateAddressHandler;
    private readonly ILogger<AddressController> _logger;
    public AddressController(
        CreateAddressHandler createAddressHandler,
        UpdateAddressHandler updateAddressHandler,
        GetAllAddressesHandler getAllAddressesHandler,
        GetAddressByIdHandler getAddressByIdHandler,
        DeleteAddressHandler deleteAddressHandler,
        ILogger<AddressController> logger)
    {
        _createAddressHandler = createAddressHandler;
        _updateAddressHandler = updateAddressHandler;
        _getAddressByIdHandler =  getAddressByIdHandler;
        _getAllAddressesHandler = getAllAddressesHandler;
        _deleteAddressHandler = deleteAddressHandler;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<int>> Create(CreateAddress command)
    {
        try
        {
            var id = await _createAddressHandler.Handle(command);
            _logger.LogInformation($"Created address with id {id}");
            return Ok(id);
        }
        catch (Exception ex)
        {
            _logger.LogError("Error creating address: {Message}", ex.Message);
            return StatusCode(500, ex.Message);
        }
    }
    
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResult<AddressDto>>> GetAll(
        [FromQuery] GetAllAddresses query)
    {
        try
        {
            if (query.PageNumber <= 0 || query.PageSize <= 0)
            {
                _logger.LogError("Invalid paging params: {PageNumber}, {PageSize}",
                    query.PageNumber, query.PageSize);
                return BadRequest("PageNumber & PageSize must be positive");
            }

            var result = await _getAllAddressesHandler.Handle(query);
            _logger.LogInformation("Retrieved {Count} addresses", result.Items.Count);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError("Error in GetAll: {Message}", ex.Message);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _getAddressByIdHandler.Handle(new GetAddressById { Id = id });

        if (result == null)
            return NotFound("Address not found");

        return Ok(result);
    }
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, UpdateAddress command)
    {
        try
        {
            if (id != command.Id)
                return BadRequest("Route id and body id do not match");

            var result = await _updateAddressHandler.Handle(command);

            if (!result)
            {
                _logger.LogWarning("Attempted update for non-existing address {Id}", id);
                return NotFound("Address not found");
            }

            _logger.LogInformation("Updated address with id {Id}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError("Error in Update: {Message}", ex.Message);
            return StatusCode(500, ex.Message);
        }
    }
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            
            var result = await _deleteAddressHandler.Handle(new DeleteAddress { Id = id });
            if (!result)
            {
                _logger.LogError("Failed to delete address with id {Id}", id);
                return NotFound("Address not found");
            }
            _logger.LogInformation($"Deleted address with id {id}");
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}