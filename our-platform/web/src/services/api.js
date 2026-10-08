// =====================================================
// MTAA API SERVICE
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL || "/api";

// =====================================================
// MY PROPERTIES
// =====================================================

export const getMyProperties = async (token) => {
  const response = await fetch(
    `${API_URL}/properties/my-properties`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

// =====================================================
// RESPONSE HANDLER
// =====================================================

const handleResponse = async (response) => {
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

// =====================================================
// AUTH
// =====================================================

export const loginUser = async (
  emailOrPayload,
  passwordArg
) => {
  const payload =
    typeof emailOrPayload === "object"
      ? emailOrPayload
      : {
          email: emailOrPayload,
          password: passwordArg,
        };

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(
          payload.email || ""
        ).trim(),
        password: payload.password,
      }),
    }
  );

  return handleResponse(response);
};

export const registerUser = async (
  payloadOrName,
  emailArg,
  phoneArg,
  passwordArg,
  roleArg = "USER"
) => {
  const payload =
    typeof payloadOrName === "object"
      ? payloadOrName
      : {
          name: payloadOrName,
          email: emailArg,
          phone: phoneArg,
          password: passwordArg,
          role: roleArg,
        };

  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        email: String(
          payload.email || ""
        ).trim(),
        phone: payload.phone || "",
        password: payload.password,
        role: payload.role || "USER",
      }),
    }
  );

  return handleResponse(response);
};

export const getCurrentUser = async (
  token
) => {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

export const getUsers = async (token) => {
  const response = await fetch(
    `${API_URL}/users`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

export const updateCurrentUser = async (
  token,
  updates
) => {
  const response = await fetch(
    `${API_URL}/users/me`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }
  );

  return handleResponse(response);
};

export const getNotifications = async (
  token
) => {
  const response = await fetch(
    `${API_URL}/notifications`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

export const markNotificationRead = async (
  token,
  notificationId
) => {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

export const markAllNotificationsRead =
  async (token) => {
    const response = await fetch(
      `${API_URL}/notifications/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const getServices = async (
  filters = {}
) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.append(key, value);
      }
    }
  );

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/services${
      query ? `?${query}` : ""
    }`
  );

  return handleResponse(response);
};

export const getMyServiceProvider =
  async (token) => {
    const response = await fetch(
      `${API_URL}/services/provider/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const requestProviderVerification =
  async (token) => {
    const response = await fetch(
      `${API_URL}/services/provider/me/verification`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const getAdminProviderVerifications =
  async (token) => {
    const response = await fetch(
      `${API_URL}/services/admin/verifications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const decideProviderVerification =
  async (
    token,
    providerId,
    decision
  ) => {
    const response = await fetch(
      `${API_URL}/services/admin/verifications/${encodeURIComponent(
        providerId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(decision),
      }
    );

    return handleResponse(response);
  };

export const submitServiceReport = async (
  token,
  report
) => {
  const response = await fetch(
    `${API_URL}/services/reports`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(report),
    }
  );

  return handleResponse(response);
};

export const getAdminServiceReports =
  async (token) => {
    const response = await fetch(
      `${API_URL}/services/admin/reports`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const decideServiceReport = async (
  token,
  reportId,
  decision
) => {
  const response = await fetch(
    `${API_URL}/services/admin/reports/${encodeURIComponent(
      reportId
    )}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(decision),
    }
  );

  return handleResponse(response);
};

export const saveServiceProviderProfile =
  async (
    token,
    profile,
    method = "POST"
  ) => {
    const response = await fetch(
      `${API_URL}/services/provider/me`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      }
    );

    return handleResponse(response);
  };

export const createOfferedService = async (
  token,
  service
) => {
  const response = await fetch(
    `${API_URL}/services/provider/me/services`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(service),
    }
  );

  return handleResponse(response);
};

export const updateOfferedService =
  async (
    token,
    serviceId,
    updates
  ) => {
    const response = await fetch(
      `${API_URL}/services/provider/me/services/${encodeURIComponent(
        serviceId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }
    );

    return handleResponse(response);
  };

export const getMyServiceRequests =
  async (token) => {
    const response = await fetch(
      `${API_URL}/services/requests/mine`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const createServiceRequest =
  async (
    token,
    request
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      }
    );

    return handleResponse(response);
  };

export const updateServiceRequestStatus =
  async (
    token,
    requestId,
    status
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    return handleResponse(response);
  };

export const submitServiceQuote =
  async (
    token,
    requestId,
    quote
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/quote`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quote),
      }
    );

    return handleResponse(response);
  };

export const decideServiceQuote =
  async (
    token,
    requestId,
    accept
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/quote-decision`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accept,
        }),
      }
    );

    return handleResponse(response);
  };

export const createServiceReview =
  async (
    token,
    requestId,
    review
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(review),
      }
    );

    return handleResponse(response);
  };

export const getServiceMessages =
  async (
    token,
    requestId
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const sendServiceMessage =
  async (
    token,
    requestId,
    content
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
        }),
      }
    );

    return handleResponse(response);
  };

export const blockServiceParticipant =
  async (
    token,
    requestId
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/block`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const unblockServiceParticipant =
  async (
    token,
    requestId
  ) => {
    const response = await fetch(
      `${API_URL}/services/requests/${encodeURIComponent(
        requestId
      )}/block`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

// =====================================================
// PROPERTIES
// =====================================================

export const getProperties = async (
  filters = {}
) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.append(key, value);
      }
    }
  );

  const queryString =
    params.toString();

  const url = queryString
    ? `${API_URL}/properties?${queryString}`
    : `${API_URL}/properties`;

  const response =
    await fetch(url);

  return handleResponse(response);
};

export const getProperty = async (
  id
) => {
  const response = await fetch(
    `${API_URL}/properties/${id}`
  );

  return handleResponse(response);
};

// =====================================================
// NEARBY PLACES
// =====================================================

export const getNearbyPlaces = async (
  propertyId
) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}/nearby-places`,
    {
      method: "GET",
    }
  );

  return handleResponse(response);
};

// =====================================================
// SAVED PROPERTIES
// =====================================================

export const getSavedProperties = async (
  token
) => {
  const response = await fetch(
    `${API_URL}/properties/saved`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

// =====================================================
// CREATE PROPERTY
// =====================================================

export const createProperty = async (
  propertyData,
  token
) => {
  const response = await fetch(
    `${API_URL}/properties`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(propertyData),
    }
  );

  return handleResponse(response);
};

// =====================================================
// UPDATE PROPERTY
// =====================================================

export const updateProperty = async (
  id,
  propertyData,
  token
) => {
  const response = await fetch(
    `${API_URL}/properties/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(propertyData),
    }
  );

  return handleResponse(response);
};

// =====================================================
// DELETE PROPERTY
// =====================================================

export const deleteProperty = async (
  id,
  token
) => {
  const response = await fetch(
    `${API_URL}/properties/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

// =====================================================
// PROPERTY IMAGES
// =====================================================

export const uploadPropertyImage =
  async (
    propertyId,
    file,
    token
  ) => {
    const formData = new FormData();

    formData.append(
      "image",
      file
    );

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

    return handleResponse(response);
  };

export const getPropertyImages =
  async (propertyId) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/images`
    );

    return handleResponse(response);
  };

export const deletePropertyImage =
  async (
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

    return handleResponse(response);
  };

export const uploadPropertyVideo =
  async (
    propertyId,
    file,
    token
  ) => {
    const formData = new FormData();

    formData.append(
      "video",
      file
    );

    const response = await fetch(
      `${API_URL}/properties/${propertyId}/videos`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    return handleResponse(response);
  };

export const getPropertyVideos =
  async (propertyId) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/videos`
    );

    return handleResponse(response);
  };

export const deletePropertyVideo =
  async (
    propertyId,
    videoId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/videos/${videoId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

// =====================================================
// LIKE / UNLIKE
// =====================================================

export const togglePropertyLike =
  async (
    propertyId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/like`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

// =====================================================
// SAVE / UNSAVE
// =====================================================

export const togglePropertySave =
  async (
    propertyId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/save`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

// =====================================================
// INTERACTION STATUS
// =====================================================

export const getPropertyInteractionStatus =
  async (
    propertyId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/interaction-status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

// =====================================================
// GET COMMENTS
// =====================================================

export const getPropertyComments =
  async (propertyId) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/comments`
    );

    return handleResponse(response);
  };

// =====================================================
// ADD COMMENT
// =====================================================

export const addPropertyComment =
  async (
    propertyId,
    content,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      }
    );

    return handleResponse(response);
  };

// =====================================================
// DELETE COMMENT
// =====================================================

export const deletePropertyComment =
  async (
    propertyId,
    commentId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/properties/comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const getPropertyReviews = async (propertyId, token) => {
  const response = await fetch(
    `${API_URL}/properties/${propertyId}/reviews`,
    {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }
  );

  return handleResponse(response);
};

export const createReview = async (
  propertyId,
  rating,
  comment,
  token
) => {
  const response = await fetch(
    `${API_URL}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        propertyId,
        rating,
        comment,
      }),
    }
  );

  return handleResponse(response);
};

export const updateReview = async (
  reviewId,
  rating,
  comment,
  token
) => {
  const response = await fetch(
    `${API_URL}/reviews/${reviewId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  );

  return handleResponse(response);
};

export const deleteReview = async (
  reviewId,
  token
) => {
  const response = await fetch(
    `${API_URL}/reviews/${reviewId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};
