export const getToken = () => {
  return localStorage.getItem("authToken");
};

export const getUserRole = () => {
  return localStorage.getItem("role");
};

export const isAuthenticated = () => {
  return !!getToken();
};
