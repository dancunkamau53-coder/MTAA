const API_URL =
  "https://reimagined-trout-wr6pxrr7jp562jx7-5000.app.github.dev/api";

// =====================================================
// AUTH
// =====================================================

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get current user");
  }

  return data;
};

// =====================================================
// PROPERTIES
// =====================================================

// Create property
export const createProperty = async (propertyData, token) => {
  const response = await fetch(`${API_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(propertyData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create property");
  }

  return data;
};

// Get all properties
export const getProperties = async () => {
  const response = await fetch(`${API_URL}/properties`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get properties");
  }

  return data;
};

// Get one property
export const getProperty = async (propertyId) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get property");
  }

  return data;
};

// Update property
export const updateProperty = async (
  propertyId,
  propertyData,
  token
) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(propertyData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update property");
  }

  return data;
};

// Delete property
export const deleteProperty = async (propertyId, token) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete property"
    );
  }

  return data;
};

// =====================================================
// PROPERTY IMAGES
// =====================================================

// Upload image to property
export const uploadPropertyImage = async (
  propertyId,
  file,
  token
) => {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    `${API_URL}/properties/${propertyId}/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to upload property image"
    );
  }

  return data;
};

// Get all images for a property
export const getPropertyImages = async (propertyId) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}/images`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to get property images"
    );
  }

  return data;
};

// Delete property image
export const deletePropertyImage = async (
  propertyId,
  imageId,
  token
) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}/images/${imageId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete property image"
    );
  }

  return data;
};
