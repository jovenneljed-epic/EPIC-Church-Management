using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
namespace EPIC.Api.Authorization;
public sealed class ClientWorkspaceErrorsAttribute : ExceptionFilterAttribute
{
    public override void OnException(ExceptionContext context)
    {
        var trace = context.HttpContext.TraceIdentifier;
        context.HttpContext.RequestServices.GetRequiredService<ILogger<ClientWorkspaceErrorsAttribute>>()
            .LogError(context.Exception, "Client workspace failed. Reference {Reference}", trace);
        var sql = context.Exception.GetBaseException() as SqlException;
        var message = sql?.Number is 207 or 208
            ? "The API database schema is missing a required table or column. Ask the administrator to check the API log and database migrations."
            : "The API could not complete this operation. Ask the administrator to check the API log.";
        context.Result = new ObjectResult(new { message = message + " Reference: " + trace }) { StatusCode = 500 };
        context.ExceptionHandled = true;
    }
}
