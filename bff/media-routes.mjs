const roles=['restaurant-manager','city-admin'];
const mediaId=/^\/v1\/media\/[a-fA-F0-9-]{36}$/;

export function mediaReadRoute(origin,allowedRoles){return {method:'GET',pattern:mediaId,roles:allowedRoles,origin};}

export function mediaRoutes(origin){
  return [
    {method:'POST',pattern:/^\/v1\/media\/uploads$/,roles,origin},
    {method:'POST',pattern:/^\/v1\/media\/[a-fA-F0-9-]{36}\/confirm$/,roles,origin},
    mediaReadRoute(origin,roles),
    {method:'DELETE',pattern:/^\/v1\/media\/[a-fA-F0-9-]{36}$/,roles,origin}
  ];
}
