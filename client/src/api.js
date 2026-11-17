const token = () => localStorage.getItem("relay_token");

async function req(method, url, body) {
  const res = await fetch("/api" + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token() && { Authorization: "Bearer " + token() }) },
    body: body && JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export const api = {
  get: (u) => req("GET", u),
  post: (u, b = {}) => req("POST", u, b),
  patch: (u, b) => req("PATCH", u, b)
};
export const setToken = (t) => (t ? localStorage.setItem("relay_token", t) : localStorage.removeItem("relay_token"));
