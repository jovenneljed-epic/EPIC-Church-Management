using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
namespace EPIC.Api.Authorization;
// Legacy Income actions query all customers. SaaS clients must use scoped workspace actions.
public sealed class InternalAccountOnlyAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if(context.HttpContext.User.IsInRole("CLIENT")) context.Result=new ObjectResult(new {message="Use the client workspace for church-specific income records."}){StatusCode=403};
    }
}
