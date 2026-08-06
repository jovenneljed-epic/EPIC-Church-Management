using Microsoft.AspNetCore.Mvc;

namespace EPIC.Api.Authorization
{
    [AttributeUsage(
        AttributeTargets.Class |
        AttributeTargets.Method,
        AllowMultiple = false)]
    public class PermissionAttribute : TypeFilterAttribute
    {
        public PermissionAttribute(
            string module,
            string action)
            : base(typeof(PermissionFilter))
        {
            Arguments = new object[]
            {
                module,
                action
            };
        }
    }
}