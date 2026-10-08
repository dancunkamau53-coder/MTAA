const prisma = require("../lib/prisma");

const notifyUser = async (userId, title, detail, type) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        detail,
        type,
      },
    });
  } catch (error) {
    console.error("Create service notification error:", error);
  }
};

const findServiceBlock = async (firstUserId, secondUserId) => {
  return prisma.serviceBlock.findFirst({
    where: {
      OR: [
        {
          blockerId: firstUserId,
          blockedUserId: secondUserId,
        },
        {
          blockerId: secondUserId,
          blockedUserId: firstUserId,
        },
      ],
    },
  });
};

const getServices = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const location = String(req.query.location || "").trim();

    const providerFilter = {};

    if (category) {
      providerFilter.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (location) {
      providerFilter.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    const where = {
      active: true,

      ...(Object.keys(providerFilter).length > 0 && {
        provider: {
          is: providerFilter,
        },
      }),

      ...(query && {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            provider: {
              is: {
                businessName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            provider: {
              is: {
                category: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      }),
    };

    const services = await prisma.offeredService.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      include: {
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            description: true,
            category: true,
            location: true,
            businessPhone: true,
            verificationStatus: true,
            verifiedAt: true,
          },
        },
      },
    });

    const providerIds = [
      ...new Set(
        services.map((service) => service.providerId)
      ),
    ];

    const ratings = providerIds.length
      ? await prisma.serviceReview.groupBy({
          by: ["providerId"],
          where: {
            providerId: {
              in: providerIds,
            },
          },
          _avg: {
            rating: true,
          },
          _count: {
            _all: true,
          },
        })
      : [];

    const ratingByProvider = new Map(
      ratings.map((rating) => [
        rating.providerId,
        rating,
      ])
    );

    return res.json({
      success: true,
      services: services.map((service) => {
        const rating = ratingByProvider.get(
          service.providerId
        );

        return {
          ...service,
          provider: {
            ...service.provider,
            ratingAverage:
              rating?._avg.rating || 0,
            reviewCount:
              rating?._count._all || 0,
          },
        };
      }),
    });
  } catch (error) {
    console.error("getServices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load services.",
      error: error.message,
    });
  }
};

const getMyProviderProfile = async (req, res) => {
  try {
    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
        include: {
          services: {
            orderBy: {
              createdAt: "desc",
            },
          },
          reviews: {
            orderBy: {
              createdAt: "desc",
            },
            take: 20,
            include: {
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

    if (!provider) {
      return res.json({
        success: true,
        provider: null,
      });
    }

    const rating =
      await prisma.serviceReview.aggregate({
        where: {
          providerId: provider.id,
        },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      });

    return res.json({
      success: true,
      provider: {
        ...provider,
        offers: provider.services,
        ratingAverage:
          rating._avg.rating || 0,
        reviewCount:
          rating._count._all || 0,
      },
    });
  } catch (error) {
    console.error(
      "getMyProviderProfile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load service provider profile.",
      error: error.message,
    });
  }
};

const requestProviderVerification = async (
  req,
  res
) => {
  try {
    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Create a business profile before requesting verification.",
      });
    }

    if (
      provider.verificationStatus ===
      "VERIFIED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This business is already verified.",
      });
    }

    if (
      provider.verificationStatus ===
      "PENDING"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This business is already waiting for admin review.",
      });
    }

    const updatedProvider =
      await prisma.serviceProvider.update({
        where: {
          id: provider.id,
        },
        data: {
          verificationStatus: "PENDING",
          verificationRequestedAt:
            new Date(),
          verificationNote: null,
        },
      });

    return res.json({
      success: true,
      provider: updatedProvider,
    });
  } catch (error) {
    console.error(
      "requestProviderVerification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to request verification.",
      error: error.message,
    });
  }
};

const getAdminProviderVerifications = async (
  req,
  res
) => {
  try {
    const providers =
      await prisma.serviceProvider.findMany({
        where: {
          verificationStatus: "PENDING",
        },
        orderBy: {
          verificationRequestedAt:
            "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          services: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              priceUnit: true,
            },
          },
        },
      });

    return res.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error(
      "getAdminProviderVerifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load provider verifications.",
      error: error.message,
    });
  }
};

const decideProviderVerification = async (
  req,
  res
) => {
  try {
    const { status, note } = req.body || {};

    if (
      !["VERIFIED", "REJECTED"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Choose VERIFIED or REJECTED.",
      });
    }

    const trimmedNote = String(
      note || ""
    ).trim();

    if (
      status === "REJECTED" &&
      !trimmedNote
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a reason when rejecting a verification request.",
      });
    }

    if (trimmedNote.length > 1000) {
      return res.status(400).json({
        success: false,
        message:
          "Verification notes must be 1,000 characters or fewer.",
      });
    }

    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          id: req.params.providerId,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Service provider not found.",
      });
    }

    if (
      provider.verificationStatus !==
      "PENDING"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This provider has no pending verification request.",
      });
    }

    const updatedProvider =
      await prisma.serviceProvider.update({
        where: {
          id: provider.id,
        },
        data: {
          verificationStatus: status,
          verifiedAt:
            status === "VERIFIED"
              ? new Date()
              : null,
          verificationNote:
            trimmedNote || null,
        },
      });

    await notifyUser(
      provider.userId,
      status === "VERIFIED"
        ? "Business verified"
        : "Verification needs attention",
      status === "VERIFIED"
        ? "An MTAA admin approved your business profile."
        : trimmedNote,
      "service-verification"
    );

    return res.json({
      success: true,
      provider: updatedProvider,
    });
  } catch (error) {
    console.error(
      "decideProviderVerification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update verification.",
      error: error.message,
    });
  }
};

const createProviderProfile = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !==
      "SERVICE_PROVIDER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Choose a service provider account to create a business profile.",
      });
    }

    const {
      businessName,
      description,
      category,
      location,
      businessPhone,
    } = req.body || {};

    const values = [
      businessName,
      description,
      category,
      location,
      businessPhone,
    ];

    if (
      values.some(
        (value) =>
          !String(value || "").trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete all business profile fields.",
      });
    }

    const existing =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "A business profile already exists for this account.",
      });
    }

    const provider =
      await prisma.serviceProvider.create({
        data: {
          businessName:
            businessName.trim(),
          description:
            description.trim(),
          category:
            category.trim(),
          location:
            location.trim(),
          businessPhone:
            businessPhone.trim(),
          userId: req.user.id,
        },
        include: {
          services: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      provider: {
        ...provider,
        offers: provider.services,
      },
    });
  } catch (error) {
    console.error(
      "createProviderProfile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create business profile.",
      error: error.message,
    });
  }
};

const updateProviderProfile = async (
  req,
  res
) => {
  try {
    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Create a business profile before updating it.",
      });
    }

    const fields = [
      "businessName",
      "description",
      "category",
      "location",
      "businessPhone",
    ];

    const data = {};

    for (const field of fields) {
      if (
        req.body?.[field] !==
        undefined
      ) {
        const value = String(
          req.body[field]
        ).trim();

        if (!value) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be empty.`,
          });
        }

        data[field] = value;
      }
    }

    if (
      Object.keys(data).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide at least one profile field to update.",
      });
    }

    data.verificationStatus =
      "UNVERIFIED";

    data.verificationRequestedAt =
      null;

    data.verifiedAt = null;

    data.verificationNote = null;

    const updatedProvider =
      await prisma.serviceProvider.update({
        where: {
          id: provider.id,
        },
        data,
        include: {
          services: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    return res.json({
      success: true,
      message:
        "Service provider profile updated.",
      provider: {
        ...updatedProvider,
        offers:
          updatedProvider.services,
      },
    });
  } catch (error) {
    console.error(
      "updateProviderProfile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update business profile.",
      error: error.message,
    });
  }
};

const createOfferedService = async (
  req,
  res
) => {
  try {
    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Create a business profile before adding services.",
      });
    }

    const {
      title,
      description,
      price,
      priceUnit,
    } = req.body || {};

    const numericPrice = Number(
      price
    );

    if (
      !String(title || "").trim() ||
      !String(description || "").trim() ||
      price === "" ||
      price === null ||
      price === undefined ||
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a service name, description, and valid non-negative price.",
      });
    }

    const service =
      await prisma.offeredService.create({
        data: {
          title: title.trim(),
          description:
            description.trim(),
          price: numericPrice,
          priceUnit:
            String(
              priceUnit || "per job"
            ).trim() ||
            "per job",
          providerId: provider.id,
        },
      });

    return res.status(201).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error(
      "createOfferedService error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create service listing.",
      error: error.message,
    });
  }
};

const updateOfferedService = async (
  req,
  res
) => {
  try {
    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
      });

    const service =
      provider &&
      (await prisma.offeredService.findFirst(
        {
          where: {
            id: req.params.serviceId,
            providerId: provider.id,
          },
        }
      ));

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Service listing not found.",
      });
    }

    const {
      title,
      description,
      price,
      priceUnit,
      active,
    } = req.body || {};

    const data = {};

    if (title !== undefined) {
      const value =
        String(title).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Service name cannot be empty.",
        });
      }

      data.title = value;
    }

    if (
      description !==
      undefined
    ) {
      const value =
        String(
          description
        ).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Service description cannot be empty.",
        });
      }

      data.description = value;
    }

    if (price !== undefined) {
      const numericPrice =
        Number(price);

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price must be a valid non-negative number.",
        });
      }

      data.price = numericPrice;
    }

    if (
      priceUnit !==
      undefined
    ) {
      const value =
        String(
          priceUnit
        ).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Price unit cannot be empty.",
        });
      }

      data.priceUnit = value;
    }

    if (active !== undefined) {
      if (
        typeof active !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Active must be true or false.",
        });
      }

      data.active = active;
    }

    if (
      Object.keys(data).length ===
      0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide at least one service field to update.",
      });
    }

    const updatedService =
      await prisma.offeredService.update({
        where: {
          id: service.id,
        },
        data,
      });

    return res.json({
      success: true,
      service: updatedService,
    });
  } catch (error) {
    console.error(
      "updateOfferedService error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update service listing.",
      error: error.message,
    });
  }
};

const createServiceRequest = async (
  req,
  res
) => {
  try {
    const {
      serviceId,
      details,
      message,
      location,
    } = req.body || {};

    const requestDetails =
      String(
        details || message || ""
      ).trim();

    const requestLocation =
      String(
        location || ""
      ).trim();

    if (
      !serviceId ||
      !requestDetails ||
      !requestLocation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select a service and provide the job details and location.",
      });
    }

    const service =
      await prisma.offeredService.findFirst(
        {
          where: {
            id: serviceId,
            active: true,
          },
          include: {
            provider: true,
          },
        }
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "This service is no longer available.",
      });
    }

    if (
      service.provider.userId ===
      req.user.id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot request your own service.",
      });
    }

    if (
      await findServiceBlock(
        req.user.id,
        service.provider.userId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot request services from this account.",
      });
    }

    const serviceRequest =
      await prisma.serviceRequest.create({
        data: {
          customerId: req.user.id,
          providerId:
            service.providerId,
          serviceId: service.id,
          details: requestDetails,
          location: requestLocation,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              price: true,
              priceUnit: true,
            },
          },
          provider: {
            select: {
              id: true,
              userId: true,
              businessName: true,
              businessPhone: true,
            },
          },
        },
      });

    await notifyUser(
      service.provider.userId,
      `New request for ${service.title}`,
      `${serviceRequest.location}: ${serviceRequest.details}`,
      "service-request"
    );

    return res.status(201).json({
      success: true,
      message:
        "Your service request has been sent to the provider.",
      request: serviceRequest,
    });
  } catch (error) {
    console.error(
      "createServiceRequest error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create service request.",
      error: error.message,
    });
  }
};

const getMyServiceRequests = async (
  req,
  res
) => {
  try {
    const provider =
      await prisma.serviceProvider.findUnique({
        where: {
          userId: req.user.id,
        },
        select: {
          id: true,
        },
      });

    const includes = {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },

      provider: {
        select: {
          id: true,
          userId: true,
          businessName: true,
          businessPhone: true,
        },
      },

      service: {
        select: {
          id: true,
          title: true,
          price: true,
          priceUnit: true,
        },
      },

      review: true,
    };

    const [
      customerRequests,
      providerRequests,
    ] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: {
          customerId: req.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: includes,
      }),

      provider
        ? prisma.serviceRequest.findMany({
            where: {
              providerId:
                provider.id,
            },
            orderBy: {
              createdAt: "desc",
            },
            include: includes,
          })
        : Promise.resolve([]),
    ]);

    const customerRequestsWithContact =
      customerRequests.map(
        (request) => ({
          ...request,
          provider: {
            ...request.provider,
            businessPhone: [
              "ACCEPTED",
              "COMPLETED",
            ].includes(
              request.status
            )
              ? request.provider
                  .businessPhone
              : null,
          },
        })
      );

    const allRequests = [
      ...customerRequestsWithContact,
      ...providerRequests,
    ];

    const uniqueRequests =
      Array.from(
        new Map(
          allRequests.map(
            (request) => [
              request.id,
              request,
            ]
          )
        ).values()
      ).sort(
        (a, b) =>
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
      );

    return res.json({
      success: true,
      requests:
        uniqueRequests,
      customerRequests:
        customerRequestsWithContact,
      providerRequests,
    });
  } catch (error) {
    console.error(
      "getMyServiceRequests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load service requests.",
      error: error.message,
    });
  }
};

const updateServiceRequestStatus =
  async (req, res) => {
    try {
      const nextStatus =
        String(
          req.body?.status || ""
        )
          .trim()
          .toUpperCase();

      const allowedStatuses = [
        "ACCEPTED",
        "DECLINED",
        "COMPLETED",
      ];

      if (
        !allowedStatuses.includes(
          nextStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Choose ACCEPTED, DECLINED, or COMPLETED.",
        });
      }

      const serviceRequest =
        await prisma.serviceRequest.findUnique(
          {
            where: {
              id: req.params.requestId,
            },
            include: {
              provider: {
                select: {
                  id: true,
                  userId: true,
                  businessName: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              service: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  priceUnit: true,
                },
              },
            },
          }
        );

      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Service request not found.",
        });
      }

      if (
        serviceRequest.provider.userId !==
        req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the service provider can update this request.",
        });
      }

      const validTransitions = {
        REQUESTED: [
          "ACCEPTED",
          "DECLINED",
        ],
        ACCEPTED: [
          "COMPLETED",
        ],
      };

      const allowedNextStatuses =
        validTransitions[
          serviceRequest.status
        ] || [];

      if (
        !allowedNextStatuses.includes(
          nextStatus
        )
      ) {
        return res.status(409).json({
          success: false,
          message: `A request cannot move from ${serviceRequest.status} to ${nextStatus}.`,
        });
      }

      const updatedRequest =
        await prisma.serviceRequest.update(
          {
            where: {
              id: serviceRequest.id,
            },
            data: {
              status: nextStatus,
            },
            include: {
              provider: {
                select: {
                  id: true,
                  userId: true,
                  businessName: true,
                  businessPhone: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              service: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  priceUnit: true,
                },
              },
            },
          }
        );

      const statusMessages = {
        ACCEPTED:
          `Your request for ${serviceRequest.service.title} has been accepted by ${serviceRequest.provider.businessName}.`,

        DECLINED:
          `Your request for ${serviceRequest.service.title} was declined by ${serviceRequest.provider.businessName}.`,

        COMPLETED:
          `Your request for ${serviceRequest.service.title} has been marked as completed by ${serviceRequest.provider.businessName}.`,
      };

      await notifyUser(
        serviceRequest.customerId,
        `Service request ${nextStatus.toLowerCase()}`,
        statusMessages[
          nextStatus
        ],
        "service-request"
      );

      return res.json({
        success: true,
        message: `Service request ${nextStatus.toLowerCase()}.`,
        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "updateServiceRequestStatus error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update service request.",
        error: error.message,
      });
    }
  };

const submitServiceQuote = async (
  req,
  res
) => {
  try {
    const rawAmount =
      req.body?.quotedPrice ??
      req.body?.amount;

    const quotedPrice =
      Number(rawAmount);

    const quoteNote =
      String(
        req.body?.quoteNote ??
          req.body?.message ??
          ""
      ).trim();

    const proposedAtValue =
      req.body?.proposedAt;

    let proposedAt = null;

    if (proposedAtValue) {
      proposedAt =
        new Date(
          proposedAtValue
        );

      if (
        Number.isNaN(
          proposedAt.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Choose a valid appointment time.",
        });
      }

      if (
        proposedAt.getTime() <=
        Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Appointment time must be in the future.",
        });
      }
    }

    if (
      rawAmount ===
        undefined ||
      rawAmount ===
        null ||
      rawAmount === "" ||
      !Number.isFinite(
        quotedPrice
      ) ||
      quotedPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid non-negative quote amount.",
      });
    }

    if (
      quoteNote.length >
      1000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quote notes must be 1,000 characters or fewer.",
      });
    }

    const serviceRequest =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id: req.params.requestId,
          },
          include: {
            provider: {
              select: {
                id: true,
                userId: true,
                businessName: true,
              },
            },
            service: {
              select: {
                title: true,
              },
            },
          },
        }
      );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Service request not found.",
      });
    }

    if (
      serviceRequest.provider.userId !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the provider can send a quote.",
      });
    }

    if (
      ![
        "REQUESTED",
        "ACCEPTED",
      ].includes(
        serviceRequest.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This request cannot receive a quote in its current status.",
      });
    }

    if (
      await findServiceBlock(
        serviceRequest.customerId,
        serviceRequest.provider.userId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "A quote cannot be sent between blocked accounts.",
      });
    }

    const quoteData = {
      status: "QUOTED",
      quotedPrice,
      quoteNote:
        quoteNote || null,
    };

    if (proposedAt) {
      quoteData.proposedAt =
        proposedAt;
    }

    const updatedRequest =
      await prisma.serviceRequest.update(
        {
          where: {
            id: serviceRequest.id,
          },
          data: quoteData,
        }
      );

    await notifyUser(
      serviceRequest.customerId,
      `A quote is ready for ${serviceRequest.service.title}`,
      `KSh ${quotedPrice.toLocaleString()}${
        quoteNote
          ? ` · ${quoteNote}`
          : ""
      }`,
      "service-request"
    );

    return res.json({
      success: true,
      request:
        updatedRequest,
    });
  } catch (error) {
    console.error(
      "submitServiceQuote error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit service quote.",
      error: error.message,
    });
  }
};

const decideServiceQuote = async (
  req,
  res
) => {
  try {
    const accept =
      req.body?.accept;

    if (
      typeof accept !==
      "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Choose whether to accept the quote.",
      });
    }

    const serviceRequest =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id: req.params.requestId,
          },
          include: {
            provider: {
              select: {
                userId: true,
                businessName: true,
              },
            },
            service: {
              select: {
                title: true,
              },
            },
          },
        }
      );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Service request not found.",
      });
    }

    if (
      serviceRequest.customerId !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the customer can decide this quote.",
      });
    }

    if (
      serviceRequest.status !==
      "QUOTED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This request has no quote awaiting a decision.",
      });
    }

    if (
      accept &&
      (await findServiceBlock(
        serviceRequest.customerId,
        serviceRequest.provider.userId
      ))
    ) {
      return res.status(403).json({
        success: false,
        message:
          "A quote cannot be accepted between blocked accounts.",
      });
    }

    const status = accept
      ? "ACCEPTED"
      : "QUOTE_DECLINED";

    const updatedRequest =
      await prisma.serviceRequest.update(
        {
          where: {
            id: serviceRequest.id,
          },
          data: {
            status,
          },
        }
      );

    await notifyUser(
      serviceRequest.provider.userId,
      accept
        ? "A customer accepted your quote"
        : "A customer declined your quote",
      `${serviceRequest.service.title} · KSh ${Number(
        serviceRequest.quotedPrice
      ).toLocaleString()}.`,
      "service-request"
    );

    return res.json({
      success: true,
      request:
        updatedRequest,
    });
  } catch (error) {
    console.error(
      "decideServiceQuote error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process quote decision.",
      error: error.message,
    });
  }
};

const createServiceReview = async (
  req,
  res
) => {
  try {
    const rating =
      Number(req.body?.rating);

    const comment =
      String(
        req.body?.comment || ""
      ).trim();

    if (
      !Number.isInteger(
        rating
      ) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Choose a rating from 1 to 5 stars.",
      });
    }

    if (
      comment.length >
      1000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Review comments must be 1,000 characters or fewer.",
      });
    }

    const serviceRequest =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id: req.params.requestId,
          },
          include: {
            provider: true,
            review: {
              select: {
                id: true,
              },
            },
          },
        }
      );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Service request not found.",
      });
    }

    if (
      serviceRequest.customerId !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the customer who made this request can review it.",
      });
    }

    if (
      serviceRequest.status !==
      "COMPLETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You can review a provider after the job is completed.",
      });
    }

    if (serviceRequest.review) {
      return res.status(409).json({
        success: false,
        message:
          "This completed request already has a review.",
      });
    }

    let review;

    try {
      review =
        await prisma.serviceReview.create(
          {
            data: {
              rating,
              comment:
                comment || null,
              requestId:
                serviceRequest.id,
              customerId:
                req.user.id,
              providerId:
                serviceRequest.providerId,
            },
          }
        );
    } catch (error) {
      if (
        error.code ===
        "P2002"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This completed request already has a review.",
        });
      }

      throw error;
    }

    await notifyUser(
      serviceRequest.provider.userId,
      "New provider review",
      `A customer gave ${rating} out of 5 stars.${
        comment
          ? ` ${comment}`
          : ""
      }`,
      "service-review"
    );

    return res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error(
      "createServiceReview error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create service review.",
      error: error.message,
    });
  }
};

const createServiceReport = async (
  req,
  res
) => {
  try {
    const {
      serviceId,
      reason,
    } = req.body || {};

    const details =
      String(
        req.body?.details || ""
      ).trim();

    const allowedReasons = [
      "FRAUD",
      "MISLEADING_INFO",
      "UNSAFE",
      "SPAM",
      "OTHER",
    ];

    if (
      !serviceId ||
      !allowedReasons.includes(
        reason
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select a service listing and a valid report reason.",
      });
    }

    if (
      details.length < 10 ||
      details.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Add between 10 and 1,000 characters describing the issue.",
      });
    }

    const service =
      await prisma.offeredService.findUnique(
        {
          where: {
            id: serviceId,
          },
          include: {
            provider: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        }
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Service listing not found.",
      });
    }

    if (
      service.provider.userId ===
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot report your own service listing.",
      });
    }

    const pendingReport =
      await prisma.serviceReport.findFirst(
        {
          where: {
            reporterId:
              req.user.id,
            serviceId,
            status: "PENDING",
          },
          select: {
            id: true,
          },
        }
      );

    if (pendingReport) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a report under review for this listing.",
      });
    }

    const report =
      await prisma.serviceReport.create({
        data: {
          reason,
          details,
          reporterId:
            req.user.id,
          providerId:
            service.provider.id,
          serviceId,
        },
      });

    return res.status(201).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error(
      "createServiceReport error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create service report.",
      error: error.message,
    });
  }
};

const getAdminServiceReports = async (
  req,
  res
) => {
  try {
    const reports =
      await prisma.serviceReport.findMany(
        {
          where: {
            status: "PENDING",
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 100,
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            provider: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            service: {
              select: {
                id: true,
                title: true,
                description: true,
                active: true,
              },
            },
          },
        }
      );

    return res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error(
      "getAdminServiceReports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load service reports.",
      error: error.message,
    });
  }
};

const decideServiceReport = async (
  req,
  res
) => {
  try {
    const { status } =
      req.body || {};

    const adminNote =
      String(
        req.body?.adminNote ||
          ""
      ).trim();

    if (
      ![
        "DISMISSED",
        "ACTIONED",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Choose DISMISSED or ACTIONED.",
      });
    }

    if (
      adminNote.length < 5 ||
      adminNote.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Add an admin note between 5 and 1,000 characters.",
      });
    }

    const report =
      await prisma.serviceReport.findUnique(
        {
          where: {
            id: req.params.reportId,
          },
          include: {
            provider: {
              select: {
                userId: true,
              },
            },
            service: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }
      );

    if (!report) {
      return res.status(404).json({
        success: false,
        message:
          "Service report not found.",
      });
    }

    if (
      report.status !==
      "PENDING"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This report has already been reviewed.",
      });
    }

    if (
      status === "ACTIONED"
    ) {
      await prisma.offeredService.update(
        {
          where: {
            id: report.serviceId,
          },
          data: {
            active: false,
          },
        }
      );
    }

    const updatedReport =
      await prisma.serviceReport.update(
        {
          where: {
            id: report.id,
          },
          data: {
            status,
            adminNote,
          },
        }
      );

    await notifyUser(
      report.reporterId,
      "Your service report was reviewed",
      status === "ACTIONED"
        ? "MTAA reviewed your report and removed the reported service listing."
        : "MTAA reviewed your report and decided no listing action was needed.",
      "service-report"
    );

    if (
      status === "ACTIONED"
    ) {
      await notifyUser(
        report.provider.userId,
        "A service listing was removed",
        `Your listing "${report.service.title}" was removed after an MTAA safety review. ${adminNote}`,
        "service-report"
      );
    }

    return res.json({
      success: true,
      report:
        updatedReport,
    });
  } catch (error) {
    console.error(
      "decideServiceReport error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process service report.",
      error: error.message,
    });
  }
};

const getServiceMessages = async (
  req,
  res
) => {
  try {
    const serviceRequest =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id: req.params.requestId,
          },
          include: {
            provider: {
              select: {
                userId: true,
              },
            },
          },
        }
      );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Service request not found.",
      });
    }

    const isCustomer =
      serviceRequest.customerId ===
      req.user.id;

    const isProvider =
      serviceRequest.provider.userId ===
      req.user.id;

    if (
      !isCustomer &&
      !isProvider
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the request participants can view this conversation.",
      });
    }

    const otherUserId =
      isCustomer
        ? serviceRequest
            .provider.userId
        : serviceRequest
            .customerId;

    const block =
      await findServiceBlock(
        req.user.id,
        otherUserId
      );

    if (
      [
        "DECLINED",
        "QUOTE_DECLINED",
      ].includes(
        serviceRequest.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Messaging is closed for this request.",
      });
    }

    const messages =
      await prisma.serviceMessage.findMany(
        {
          where: {
            requestId:
              serviceRequest.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 200,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }
      );

    return res.json({
      success: true,
      messages:
        messages.reverse(),
      blocked:
        Boolean(block),
      blockedByMe:
        block?.blockerId ===
        req.user.id,
    });
  } catch (error) {
    console.error(
      "getServiceMessages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load service messages.",
      error: error.message,
    });
  }
};

const sendServiceMessage = async (
  req,
  res
) => {
  try {
    const content =
      String(
        req.body?.content || ""
      ).trim();

    if (
      !content ||
      content.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Messages must contain between 1 and 2,000 characters.",
      });
    }

    const serviceRequest =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id: req.params.requestId,
          },
          include: {
            provider: {
              select: {
                userId: true,
              },
            },
            service: {
              select: {
                title: true,
              },
            },
          },
        }
      );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Service request not found.",
      });
    }

    const isCustomer =
      serviceRequest.customerId ===
      req.user.id;

    const isProvider =
      serviceRequest.provider.userId ===
      req.user.id;

    if (
      !isCustomer &&
      !isProvider
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the request participants can send messages.",
      });
    }

    const recipientId =
      isCustomer
        ? serviceRequest
            .provider.userId
        : serviceRequest
            .customerId;

    const block =
      await findServiceBlock(
        req.user.id,
        recipientId
      );

    if (block) {
      return res.status(403).json({
        success: false,
        message:
          "Messaging is unavailable between these accounts.",
      });
    }

    if (
      [
        "DECLINED",
        "QUOTE_DECLINED",
      ].includes(
        serviceRequest.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Messaging is closed for this request.",
      });
    }

    const message =
      await prisma.serviceMessage.create(
        {
          data: {
            requestId:
              serviceRequest.id,
            senderId:
              req.user.id,
            content,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }
      );

    await notifyUser(
      recipientId,
      `New message about ${serviceRequest.service.title}`,
      content,
      "service-message"
    );

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error(
      "sendServiceMessage error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to send service message.",
      error: error.message,
    });
  }
};

const blockServiceParticipant =
  async (req, res) => {
    try {
      const serviceRequest =
        await prisma.serviceRequest.findUnique(
          {
            where: {
              id: req.params.requestId,
            },
            include: {
              provider: {
                select: {
                  userId: true,
                },
              },
            },
          }
        );

      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Service request not found.",
        });
      }

      const isCustomer =
        serviceRequest.customerId ===
        req.user.id;

      const isProvider =
        serviceRequest.provider.userId ===
        req.user.id;

      if (
        !isCustomer &&
        !isProvider
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the request participants can block each other.",
        });
      }

      const blockedUserId =
        isCustomer
          ? serviceRequest
              .provider.userId
          : serviceRequest
              .customerId;

      try {
        await prisma.serviceBlock.create(
          {
            data: {
              blockerId:
                req.user.id,
              blockedUserId,
            },
          }
        );
      } catch (error) {
        if (
          error.code !==
          "P2002"
        ) {
          throw error;
        }
      }

      return res.json({
        success: true,
        blocked: true,
      });
    } catch (error) {
      console.error(
        "blockServiceParticipant error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to block participant.",
        error: error.message,
      });
    }
  };

const unblockServiceParticipant =
  async (req, res) => {
    try {
      const serviceRequest =
        await prisma.serviceRequest.findUnique(
          {
            where: {
              id: req.params.requestId,
            },
            include: {
              provider: {
                select: {
                  userId: true,
                },
              },
            },
          }
        );

      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Service request not found.",
        });
      }

      const isCustomer =
        serviceRequest.customerId ===
        req.user.id;

      const isProvider =
        serviceRequest.provider.userId ===
        req.user.id;

      if (
        !isCustomer &&
        !isProvider
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the request participants can unblock each other.",
        });
      }

      const otherUserId =
        isCustomer
          ? serviceRequest
              .provider.userId
          : serviceRequest
              .customerId;

      await prisma.serviceBlock.deleteMany(
        {
          where: {
            blockerId:
              req.user.id,
            blockedUserId:
              otherUserId,
          },
        }
      );

      const remainingBlock =
        await findServiceBlock(
          req.user.id,
          otherUserId
        );

      return res.json({
        success: true,
        blocked:
          Boolean(
            remainingBlock
          ),
        blockedByMe:
          remainingBlock?.blockerId ===
          req.user.id,
      });
    } catch (error) {
      console.error(
        "unblockServiceParticipant error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to unblock participant.",
        error: error.message,
      });
    }
  };

module.exports = {
  getServices,
  getMyProviderProfile,
  requestProviderVerification,
  getAdminProviderVerifications,
  decideProviderVerification,
  createProviderProfile,
  updateProviderProfile,
  createOfferedService,
  updateOfferedService,
  createServiceRequest,
  getMyServiceRequests,
  updateServiceRequestStatus,
  submitServiceQuote,
  decideServiceQuote,
  createServiceReview,
  createServiceReport,
  getAdminServiceReports,
  decideServiceReport,
  getServiceMessages,
  sendServiceMessage,
  blockServiceParticipant,
  unblockServiceParticipant,
};