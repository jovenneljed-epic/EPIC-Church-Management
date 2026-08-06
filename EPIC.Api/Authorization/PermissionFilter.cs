using EPIC.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace EPIC.Api.Authorization
{
    public class PermissionFilter : IAsyncAuthorizationFilter
    {
        private readonly IPermissionService _permissionService;
        private readonly string _module;
        private readonly string _action;

        public PermissionFilter(
            IPermissionService permissionService,
            string module,
            string action)
        {
            _permissionService = permissionService;
            _module = module;
            _action = action;
        }

        public async Task OnAuthorizationAsync(
            AuthorizationFilterContext context)
        {
            // =====================================================
            // REQUIRE AUTHENTICATION
            // =====================================================

            if (context.HttpContext.User?.Identity?.IsAuthenticated != true)
            {
                context.Result =
                    new UnauthorizedObjectResult(new
                    {
                        message = "Authentication is required."
                    });

                return;
            }

            // =====================================================
            // CHECK PERMISSION
            // =====================================================

            bool allowed =
                await _permissionService.HasPermissionAsync(
                    context.HttpContext.User,
                    _module,
                    _action);

            // =====================================================
            // DENIED
            // =====================================================

            if (!allowed)
            {
                context.Result =
                    new ObjectResult(new
                    {
                        message = "Permission denied.",
                        module = _module,
                        action = _action
                    })
                    {
                        StatusCode =
                            StatusCodes.Status403Forbidden
                    };
            }
        }
    }
}