import { useEffect, useState } from "react";
import {
  createOfferedService,
  createServiceReview,
  createServiceRequest,
  decideServiceQuote,
  blockServiceParticipant,
  getServiceMessages,
  getMyServiceProvider,
  getMyServiceRequests,
  getServices,
  requestProviderVerification,
  saveServiceProviderProfile,
  sendServiceMessage,
  submitServiceReport,
  submitServiceQuote,
  unblockServiceParticipant,
  updateOfferedService,
  updateServiceRequestStatus,
} from "./services/api";
import "./Services.css";

const serviceCategories = [
  "Home maintenance",
  "Moving & delivery",
  "Cleaning & laundry",
  "Education & tutoring",
  "Food & catering",
  "Personal care",
  "Automotive",
  "Photography & events",
  "Other",
];

const initialProvider = {
  businessName: "",
  description: "",
  category: serviceCategories[0],
  location: "",
  businessPhone: "",
};

const initialOffer = {
  title: "",
  description: "",
  price: "",
  priceUnit: "per job",
};

function Services({
  user,
  onBack,
  onRequireAuth,
  initialTab = "directory",
  initialServiceId = "",
  onRequireLogin,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [provider, setProvider] = useState(null);
  const [providerLoading, setProviderLoading] = useState(Boolean(user));
  const [providerRequests, setProviderRequests] = useState([]);
  const [customerRequests, setCustomerRequests] = useState([]);
  const [providerForm, setProviderForm] = useState(initialProvider);
  const [offerForm, setOfferForm] = useState(initialOffer);
  const [requestForm, setRequestForm] = useState({ details: "", location: "" });
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ quotedPrice: "", proposedAt: "", quoteNote: "" });
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);
  const [selectedReportService, setSelectedReportService] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [conversationBlocked, setConversationBlocked] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reportForm, setReportForm] = useState({ reason: "FRAUD", details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const token = localStorage.getItem("mtaa_token");
  const userId = user?.id;
  const selectedService = services.find((service) => service.id === selectedServiceId);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingServices(true);
        setDirectoryError("");
        const data = await getServices({ q: query, location, category });
        if (active) setServices(data.services || []);
      } catch {
        if (active) setDirectoryError("Unable to load services. Please try again.");
      } finally {
        if (active) setLoadingServices(false);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query, location, category]);

  useEffect(() => {
    if (!userId) return undefined;

    let active = true;
    const loadAccountServices = async () => {
      try {
        const [providerData, requestData] = await Promise.all([
          getMyServiceProvider(token),
          getMyServiceRequests(token),
        ]);
        if (!active) return;
        setProvider(providerData.provider || null);
        setProviderRequests(requestData.providerRequests || []);
        setCustomerRequests(requestData.customerRequests || []);
        if (providerData.provider) {
          setProviderForm({
            businessName: providerData.provider.businessName,
            description: providerData.provider.description,
            category: providerData.provider.category,
            location: providerData.provider.location,
            businessPhone: providerData.provider.businessPhone,
          });
        }
      } catch {
        if (active) setActionError("Unable to load your service account.");
      } finally {
        if (active) setProviderLoading(false);
      }
    };

    loadAccountServices();
    return () => {
      active = false;
    };
  }, [userId, token]);

  useEffect(() => {
    const requestId = selectedConversation?.id;
    if (!requestId) return undefined;

    let active = true;
    let loadingMessages = false;
    const loadMessages = async () => {
      if (loadingMessages) return;
      loadingMessages = true;
      try {
        const data = await getServiceMessages(token, requestId);
        if (active) {
          setConversationMessages(data.messages || []);
          setConversationError("");
          setConversationBlocked(Boolean(data.blocked));
          setBlockedByMe(Boolean(data.blockedByMe));
        }
      } catch (error) {
        if (active) setConversationError(error.message || "Unable to load this conversation.");
      } finally {
        loadingMessages = false;
        if (active) setConversationLoading(false);
      }
    };

    loadMessages();
    const refreshInterval = window.setInterval(loadMessages, 8000);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [selectedConversation?.id, token]);

  const refreshRequests = async () => {
    const data = await getMyServiceRequests(token);
    setProviderRequests(data.providerRequests || []);
    setCustomerRequests(data.customerRequests || []);
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    if (!selectedService) return;

    if (!user) {
      onRequireAuth(selectedService.id);
      return;
    }

    setSubmitting(true);
    setActionError("");
    try {
      await createServiceRequest(token, {
        serviceId: selectedService.id,
        details: requestForm.details,
        location: requestForm.location,
      });
      setSelectedServiceId("");
      setRequestForm({ details: "", location: "" });
      setNotice("Your request was sent to the provider.");
      await refreshRequests();
    } catch (error) {
      setActionError(error.message || "Unable to send your request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      const data = await saveServiceProviderProfile(token, providerForm);
      setProvider(data.provider);
      setNotice("Business profile created. Add your first service listing.");
    } catch (error) {
      setActionError(error.message || "Unable to create your business profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOffer = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      const data = await createOfferedService(token, offerForm);
      setProvider((current) => ({
        ...current,
        services: [data.service, ...(current?.services || [])],
      }));
      setOfferForm(initialOffer);
      setNotice("Your service is now listed in the directory.");
    } catch (error) {
      setActionError(error.message || "Unable to add this service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    setActionError("");
    try {
      await updateServiceRequestStatus(token, requestId, status);
      await refreshRequests();
      setNotice(`Request ${status.toLowerCase()}.`);
    } catch (error) {
      setActionError(error.message || "Unable to update this request.");
    }
  };

  const handleSubmitQuote = async (event) => {
    event.preventDefault();
    if (!selectedQuoteRequest) return;

    setSubmitting(true);
    setActionError("");
    try {
      await submitServiceQuote(token, selectedQuoteRequest.id, {
        quotedPrice: quoteForm.quotedPrice,
        proposedAt: new Date(quoteForm.proposedAt).toISOString(),
        quoteNote: quoteForm.quoteNote,
      });
      await refreshRequests();
      setSelectedQuoteRequest(null);
      setQuoteForm({ quotedPrice: "", proposedAt: "", quoteNote: "" });
      setNotice("Quote sent to the customer for approval.");
    } catch (error) {
      setActionError(error.message || "Unable to send this quote.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuoteDecision = async (requestId, accept) => {
    setActionError("");
    try {
      await decideServiceQuote(token, requestId, accept);
      await refreshRequests();
      setNotice(accept ? "Quote accepted. The job is booked." : "Quote declined.");
    } catch (error) {
      setActionError(error.message || "Unable to update the quote decision.");
    }
  };

  const openQuoteForm = (request) => {
    setSelectedQuoteRequest(request);
    setQuoteForm({ quotedPrice: "", proposedAt: "", quoteNote: "" });
  };

  const handleServiceAvailability = async (service) => {
    setActionError("");
    try {
      const data = await updateOfferedService(token, service.id, {
        active: !service.active,
      });
      setProvider((current) => ({
        ...current,
        services: current.services.map((item) =>
          item.id === service.id ? data.service : item
        ),
      }));
      setNotice(data.service.active ? "Service listing published." : "Service listing paused.");
    } catch (error) {
      setActionError(error.message || "Unable to update this service listing.");
    }
  };

  const handleVerificationRequest = async () => {
    setActionError("");
    try {
      const data = await requestProviderVerification(token);
      setProvider((current) => ({ ...current, ...data.provider }));
      setNotice("Your verification request was sent to the MTAA admin team.");
    } catch (error) {
      setActionError(error.message || "Unable to request verification.");
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();
    if (!selectedReviewRequest) return;

    setSubmitting(true);
    setActionError("");
    try {
      await createServiceReview(token, selectedReviewRequest.id, reviewForm);
      await refreshRequests();
      setSelectedReviewRequest(null);
      setReviewForm({ rating: "5", comment: "" });
      setNotice("Thank you. Your review was submitted.");
    } catch (error) {
      setActionError(error.message || "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const openConversation = (request) => {
    setSelectedConversation(request);
    setConversationMessages([]);
    setConversationLoading(true);
    setConversationError("");
    setConversationBlocked(false);
    setBlockedByMe(false);
    setConfirmBlock(false);
    setMessageDraft("");
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedConversation || !messageDraft.trim()) return;

    setMessageSending(true);
    setConversationError("");
    try {
      const data = await sendServiceMessage(token, selectedConversation.id, messageDraft);
      setConversationMessages((current) => [...current, data.message]);
      setMessageDraft("");
    } catch (error) {
      setConversationError(error.message || "Unable to send your message.");
    } finally {
      setMessageSending(false);
    }
  };

  const handleBlockParticipant = async () => {
    if (!selectedConversation) return;

    setBlockingUser(true);
    setConversationError("");
    try {
      await blockServiceParticipant(token, selectedConversation.id);
      setConversationBlocked(true);
      setBlockedByMe(true);
      setConfirmBlock(false);
    } catch (error) {
      setConversationError(error.message || "Unable to block this account.");
    } finally {
      setBlockingUser(false);
    }
  };

  const handleUnblockParticipant = async () => {
    if (!selectedConversation) return;

    setBlockingUser(true);
    setConversationError("");
    try {
      const result = await unblockServiceParticipant(token, selectedConversation.id);
      setConversationBlocked(result.blocked);
      setBlockedByMe(result.blockedByMe);
      setNotice(result.blocked
        ? "You removed your block. The other account still has a block in place."
        : "This account is unblocked.");
    } catch (error) {
      setConversationError(error.message || "Unable to unblock this account.");
    } finally {
      setBlockingUser(false);
    }
  };

  const handleReport = async (event) => {
    event.preventDefault();
    if (!selectedReportService) return;

    setSubmitting(true);
    setActionError("");
    try {
      await submitServiceReport(token, {
        serviceId: selectedReportService.id,
        ...reportForm,
      });
      setSelectedReportService(null);
      setReportForm({ reason: "FRAUD", details: "" });
      setNotice("Thanks. Your report was sent to the MTAA moderation team.");
    } catch (error) {
      setActionError(error.message || "Unable to submit your report.");
    } finally {
      setSubmitting(false);
    }
  };

  const openReportForm = (service) => {
    if (!user) {
      onRequireLogin();
      return;
    }
    setSelectedReportService(service);
  };

  const statusLabel = (status) =>
    status.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

  return (
    <div className="service-marketplace">
      <header className="service-marketplace-header">
        <button type="button" className="service-back" onClick={onBack}>
          ← Back
        </button>
        <a className="service-wordmark" href="#services-home" onClick={onBack}>
          MTAA <span>LOCAL</span>
        </a>
        <div className="service-header-account">
          {user ? user.name : "Local services"}
        </div>
      </header>

      <main className="service-marketplace-main">
        <section className="service-marketplace-heading">
          <div>
            <p className="service-eyebrow">SERVICES AROUND YOUR MTAA</p>
            <h1>Find trusted local help.</h1>
            <p>Compare providers, see their prices, and send a job request directly.</p>
          </div>
          <button
            type="button"
            className="service-provider-cta"
            onClick={() => setActiveTab("provider")}
          >
            {user?.role === "SERVICE_PROVIDER" ? "Provider portal" : "Offer a service"}
          </button>
        </section>

        {notice && <div className="service-notice">{notice}</div>}
        {actionError && <div className="service-error">{actionError}</div>}

        <nav className="service-tabs" aria-label="Service marketplace">
          <button
            type="button"
            className={activeTab === "directory" ? "active" : ""}
            onClick={() => setActiveTab("directory")}
          >
            Find a service
          </button>
          {user && (
            <button
              type="button"
              className={activeTab === "requests" ? "active" : ""}
              onClick={() => setActiveTab("requests")}
            >
              My requests
            </button>
          )}
          <button
            type="button"
            className={activeTab === "provider" ? "active" : ""}
            onClick={() => setActiveTab("provider")}
          >
            Provider portal
          </button>
        </nav>

        {activeTab === "directory" && (
          <section className="service-directory">
            <div className="service-filters">
              <label>
                <span>Search services</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Plumber, tutor, moving company..."
                />
              </label>
              <label>
                <span>Area</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Kasarani, Nairobi"
                />
              </label>
              <label>
                <span>Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">All services</option>
                  {serviceCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            {loadingServices && <p className="service-state">Finding local providers...</p>}
            {directoryError && <p className="service-state error">{directoryError}</p>}
            {!loadingServices && !directoryError && services.length === 0 && (
              <div className="service-state">
                <strong>No matching services yet.</strong>
                <span>Try another search or invite a local provider to join MTAA.</span>
              </div>
            )}

            <div className="service-offer-grid">
              {services.map((service) => (
                <article className="service-offer" key={service.id}>
                  <div className="service-offer-topline">
                    <span>{service.provider.category}</span>
                    <span>{service.provider.location}</span>
                  </div>
                  <h2>{service.title}</h2>
                  <p className="service-business-name">{service.provider.businessName}</p>
                  <p className="service-provider-rating">
                    {service.provider.reviewCount > 0
                      ? `★ ${Number(service.provider.ratingAverage).toFixed(1)} · ${service.provider.reviewCount} ${service.provider.reviewCount === 1 ? "review" : "reviews"}`
                      : "New provider"}
                    {service.provider.verificationStatus === "VERIFIED" && (
                      <span className="verified-badge">Business verified</span>
                    )}
                  </p>
                  <p className="service-offer-description">{service.description}</p>
                  <div className="service-offer-footer">
                    <p>
                      <strong>KSh {Number(service.price).toLocaleString()}</strong>
                      <span> {service.priceUnit}</span>
                    </p>
                    <button type="button" onClick={() => {
                      setSelectedServiceId(service.id);
                      setRequestForm({ details: "", location: location || service.provider.location });
                    }}>
                      Request service
                    </button>
                  </div>
                  <button
                    type="button"
                    className="report-service-button"
                    onClick={() => openReportForm(service)}
                  >
                    Report listing
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "provider" && (
          <section className="provider-portal">
            {!user ? (
              <div className="service-state provider-signup-state">
                <strong>Create an account to offer services on MTAA.</strong>
                <span>Choose “Service Provider” during registration to open your business portal.</span>
                <button type="button" onClick={() => onRequireAuth(null)}>Create provider account</button>
              </div>
            ) : providerLoading ? (
              <p className="service-state">Loading provider portal...</p>
            ) : user.role !== "SERVICE_PROVIDER" ? (
              <div className="service-state provider-signup-state">
                <strong>This account is not registered as a service provider.</strong>
                <span>Sign out and create a Service Provider account to publish business listings.</span>
              </div>
            ) : !provider ? (
              <form className="provider-form" onSubmit={handleProviderProfile}>
                <div className="provider-form-heading">
                  <p className="service-eyebrow">PROVIDER SETUP</p>
                  <h2>Create your business profile</h2>
                  <p>Tell nearby customers what you do and where you work.</p>
                </div>
                <label>Business name<input required value={providerForm.businessName} onChange={(event) => setProviderForm({ ...providerForm, businessName: event.target.value })} /></label>
                <label>Business category<select required value={providerForm.category} onChange={(event) => setProviderForm({ ...providerForm, category: event.target.value })}>{serviceCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Service area<input required value={providerForm.location} onChange={(event) => setProviderForm({ ...providerForm, location: event.target.value })} placeholder="Kasarani, Nairobi" /></label>
                <label>Business phone<input required type="tel" value={providerForm.businessPhone} onChange={(event) => setProviderForm({ ...providerForm, businessPhone: event.target.value })} /></label>
                <label className="provider-form-wide">About your business<textarea required rows="4" value={providerForm.description} onChange={(event) => setProviderForm({ ...providerForm, description: event.target.value })} /></label>
                <button className="service-submit" type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create business profile"}</button>
              </form>
            ) : (
              <div className="provider-workspace">
                <section className="provider-business-summary">
                  <div>
                    <p className="service-eyebrow">YOUR BUSINESS</p>
                    <h2>{provider.businessName}</h2>
                    <p>{provider.category} · {provider.location}</p>
                    <span className="provider-rating-summary">
                      {provider.reviewCount > 0
                        ? `★ ${Number(provider.ratingAverage).toFixed(1)} from ${provider.reviewCount} ${provider.reviewCount === 1 ? "review" : "reviews"}`
                        : "No reviews yet"}
                    </span>
                    <div className="provider-verification-status">
                      <span className={`verification-badge ${provider.verificationStatus?.toLowerCase() || "unverified"}`}>
                        {provider.verificationStatus === "VERIFIED"
                          ? "Business verified"
                          : provider.verificationStatus === "PENDING"
                          ? "Verification pending"
                          : provider.verificationStatus === "REJECTED"
                          ? "Verification needs changes"
                          : "Not verified"}
                      </span>
                      {provider.verificationStatus !== "VERIFIED" && provider.verificationStatus !== "PENDING" && (
                        <button type="button" className="verification-request-button" onClick={handleVerificationRequest}>
                          {provider.verificationStatus === "REJECTED" ? "Resubmit for review" : "Request verification"}
                        </button>
                      )}
                      <small>MTAA admins review your business details and contact the listed business number.</small>
                    </div>
                    {provider.verificationStatus === "REJECTED" && provider.verificationNote && (
                      <p className="verification-feedback">Admin note: {provider.verificationNote}</p>
                    )}
                  </div>
                  <span>{provider.businessPhone}</span>
                </section>

                <div className="provider-workspace-grid">
                  <form className="provider-form provider-offer-form" onSubmit={handleOffer}>
                    <div className="provider-form-heading">
                      <p className="service-eyebrow">SERVICE LISTING</p>
                      <h2>Add a service and price</h2>
                    </div>
                    <label>Service name<input required value={offerForm.title} onChange={(event) => setOfferForm({ ...offerForm, title: event.target.value })} placeholder="e.g. Tap and pipe repair" /></label>
                    <label>Description<textarea required rows="3" value={offerForm.description} onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })} /></label>
                    <div className="provider-price-fields">
                      <label>Price (KSh)<input required type="number" min="0" step="1" value={offerForm.price} onChange={(event) => setOfferForm({ ...offerForm, price: event.target.value })} /></label>
                      <label>Price unit<input required value={offerForm.priceUnit} onChange={(event) => setOfferForm({ ...offerForm, priceUnit: event.target.value })} placeholder="per job" /></label>
                    </div>
                    <button className="service-submit" type="submit" disabled={submitting}>{submitting ? "Adding..." : "Publish service"}</button>
                  </form>

                  <section className="provider-offer-list">
                    <div className="provider-form-heading">
                      <p className="service-eyebrow">PUBLISHED SERVICES</p>
                      <h2>{provider.services?.length || 0} listings</h2>
                    </div>
                    {provider.services?.length ? provider.services.map((service) => (
                      <article className="provider-offer-row" key={service.id}>
                        <div>
                          <strong>{service.title}</strong>
                          <span>KSh {Number(service.price).toLocaleString()} {service.priceUnit}</span>
                        </div>
                        <button
                          type="button"
                          className={`service-availability ${service.active ? "service-live" : "service-paused"}`}
                          onClick={() => handleServiceAvailability(service)}
                        >
                          {service.active ? "Pause listing" : "Publish listing"}
                        </button>
                      </article>
                    )) : <p className="service-state">Your services will appear here after publishing.</p>}
                  </section>
                </div>

                <section className="provider-requests">
                  <div className="provider-form-heading">
                    <p className="service-eyebrow">INCOMING WORK</p>
                    <h2>Service requests</h2>
                  </div>
                  {providerRequests.length === 0 ? <p className="service-state">No customer requests yet.</p> : providerRequests.map((request) => (
                    <article className="service-request-row" key={request.id}>
                      <div className="service-request-copy">
                        <div><strong>{request.service.title}</strong><span className={`request-status ${request.status.toLowerCase()}`}>{statusLabel(request.status)}</span></div>
                        <p>{request.details}</p>
                        <small>{request.location} · {request.customer.name} · {new Date(request.createdAt).toLocaleDateString()}</small>
                      </div>
                      {request.status !== "DECLINED" && (
                        <button type="button" className="service-message-open" onClick={() => openConversation(request)}>
                          Message customer
                        </button>
                      )}
                      {request.status === "REQUESTED" && <div className="service-request-actions"><button type="button" onClick={() => openQuoteForm(request)}>Send quote</button><button type="button" className="decline" onClick={() => handleRequestStatus(request.id, "DECLINED")}>Decline</button></div>}
                      {request.status === "QUOTED" && (
                        <p className="provider-quote-waiting">
                          Quote sent: KSh {Number(request.quotedPrice).toLocaleString()} · waiting for customer decision
                        </p>
                      )}
                      {request.status === "ACCEPTED" && <button type="button" onClick={() => handleRequestStatus(request.id, "COMPLETED")}>Mark complete</button>}
                    </article>
                  ))}
                </section>

                <section className="provider-reviews">
                  <div className="provider-form-heading">
                    <p className="service-eyebrow">CUSTOMER FEEDBACK</p>
                    <h2>Reviews</h2>
                  </div>
                  {provider.reviews?.length ? provider.reviews.map((review) => (
                    <article className="service-review-row" key={review.id}>
                      <div className="service-review-heading">
                        <strong>{review.customer.name}</strong>
                        <span aria-label={`${review.rating} out of 5 stars`}>
                          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                        </span>
                      </div>
                      {review.comment && <p>{review.comment}</p>}
                      <small>{new Date(review.createdAt).toLocaleDateString()}</small>
                    </article>
                  )) : <p className="service-state">Reviews from completed jobs will appear here.</p>}
                </section>
              </div>
            )}
          </section>
        )}

        {activeTab === "requests" && user && (
          <section className="customer-requests">
            <div className="provider-form-heading">
              <p className="service-eyebrow">YOUR ACTIVITY</p>
              <h2>My service requests</h2>
            </div>
            {customerRequests.length === 0 ? <p className="service-state">You have not requested a service yet.</p> : customerRequests.map((request) => (
              <article className="service-request-row" key={request.id}>
                <div className="service-request-copy">
                  <div><strong>{request.service.title}</strong><span className={`request-status ${request.status.toLowerCase().replaceAll("_", "-")}`}>{statusLabel(request.status)}</span></div>
                  <p>{request.details}</p>
                  <small>{request.location} · {request.provider.businessName} · {new Date(request.createdAt).toLocaleDateString()}</small>
                  {request.quotedPrice !== null && request.quotedPrice !== undefined && (
                    <div className="customer-quote-summary">
                      <strong>Provider quote: KSh {Number(request.quotedPrice).toLocaleString()}</strong>
                      {request.proposedAt && <span>Proposed time: {new Date(request.proposedAt).toLocaleString()}</span>}
                      {request.quoteNote && <p>{request.quoteNote}</p>}
                    </div>
                  )}
                    {request.provider.businessPhone && (
                      <p className="accepted-provider-contact">
                        Provider business number: {request.provider.businessPhone}
                      </p>
                    )}
                </div>
                  {request.status !== "DECLINED" && (
                    <button type="button" className="service-message-open" onClick={() => openConversation(request)}>
                      Message provider
                    </button>
                  )}
                  {request.status === "QUOTED" && (
                    <div className="quote-decision-actions">
                      <button type="button" onClick={() => handleQuoteDecision(request.id, true)}>Accept quote</button>
                      <button type="button" className="decline" onClick={() => handleQuoteDecision(request.id, false)}>Decline quote</button>
                    </div>
                  )}
                  {request.status === "QUOTE_DECLINED" && <p className="quote-declined-note">You declined this quote. Send a new service request if you need a different arrangement.</p>}
                {request.status === "COMPLETED" && (
                  request.review ? (
                    <p className="review-complete-note">
                      Your review: {"★".repeat(request.review.rating)}{"☆".repeat(5 - request.review.rating)}
                      {request.review.comment && ` · ${request.review.comment}`}
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="leave-review-button"
                      onClick={() => setSelectedReviewRequest(request)}
                    >
                      Leave review
                    </button>
                  )
                )}
              </article>
            ))}
          </section>
        )}
      </main>

      {selectedService && (
        <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedServiceId("");
        }}>
          <section className="service-request-modal" role="dialog" aria-modal="true" aria-labelledby="service-request-title">
            <button className="service-modal-close" type="button" aria-label="Close request form" onClick={() => setSelectedServiceId("")}>×</button>
            <p className="service-eyebrow">REQUEST A PROVIDER</p>
            <h2 id="service-request-title">{selectedService.title}</h2>
            <p>{selectedService.provider.businessName} · KSh {Number(selectedService.price).toLocaleString()} {selectedService.priceUnit}</p>
            <form onSubmit={handleRequest}>
              <label>Where do you need the service?<input required value={requestForm.location} onChange={(event) => setRequestForm({ ...requestForm, location: event.target.value })} /></label>
              <label>What do you need done?<textarea required rows="4" value={requestForm.details} onChange={(event) => setRequestForm({ ...requestForm, details: event.target.value })} placeholder="Share the job details and a good time to reach you." /></label>
              <button className="service-submit" type="submit" disabled={submitting}>{user ? (submitting ? "Sending..." : "Send request") : "Sign in to request"}</button>
            </form>
          </section>
        </div>
      )}

      {selectedQuoteRequest && (
        <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedQuoteRequest(null);
        }}>
          <section className="service-request-modal" role="dialog" aria-modal="true" aria-labelledby="service-quote-title">
            <button className="service-modal-close" type="button" aria-label="Close quote form" onClick={() => setSelectedQuoteRequest(null)}>×</button>
            <p className="service-eyebrow">PROPOSE PRICE AND TIME</p>
            <h2 id="service-quote-title">Quote {selectedQuoteRequest.service.title}</h2>
            <p>{selectedQuoteRequest.customer.name} · {selectedQuoteRequest.location}</p>
            <form onSubmit={handleSubmitQuote}>
              <label>Final price (KSh)
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={quoteForm.quotedPrice}
                  onChange={(event) => setQuoteForm({ ...quoteForm, quotedPrice: event.target.value })}
                />
              </label>
              <label>Proposed appointment time
                <input
                  required
                  type="datetime-local"
                  value={quoteForm.proposedAt}
                  onChange={(event) => setQuoteForm({ ...quoteForm, proposedAt: event.target.value })}
                />
              </label>
              <label>Note for customer (optional)
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={quoteForm.quoteNote}
                  onChange={(event) => setQuoteForm({ ...quoteForm, quoteNote: event.target.value })}
                  placeholder="Explain what is included in this price."
                />
              </label>
              <button className="service-submit" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send quote"}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedReviewRequest && (
        <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedReviewRequest(null);
        }}>
          <section className="service-request-modal" role="dialog" aria-modal="true" aria-labelledby="service-review-title">
            <button className="service-modal-close" type="button" aria-label="Close review form" onClick={() => setSelectedReviewRequest(null)}>×</button>
            <p className="service-eyebrow">COMPLETED SERVICE</p>
            <h2 id="service-review-title">Review {selectedReviewRequest.provider.businessName}</h2>
            <p>{selectedReviewRequest.service.title}</p>
            <form onSubmit={handleReview}>
              <label>Rating
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>
                  ))}
                </select>
              </label>
              <label>Review (optional)
                <textarea
                  rows="4"
                  maxLength="1000"
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                  placeholder="Share what went well or what could improve."
                />
              </label>
              <button className="service-submit" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedReportService && (
        <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedReportService(null);
        }}>
          <section className="service-request-modal" role="dialog" aria-modal="true" aria-labelledby="service-report-title">
            <button className="service-modal-close" type="button" aria-label="Close report form" onClick={() => setSelectedReportService(null)}>×</button>
            <p className="service-eyebrow">SAFETY REPORT</p>
            <h2 id="service-report-title">Report {selectedReportService.title}</h2>
            <p>Reports are reviewed by MTAA admins. False or abusive reports may affect your account.</p>
            <form onSubmit={handleReport}>
              <label>Reason
                <select
                  value={reportForm.reason}
                  onChange={(event) => setReportForm({ ...reportForm, reason: event.target.value })}
                >
                  <option value="FRAUD">Suspected scam or fraud</option>
                  <option value="MISLEADING_INFO">Misleading business information</option>
                  <option value="UNSAFE">Safety concern</option>
                  <option value="SPAM">Spam or duplicate listing</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label>What happened?
                <textarea
                  required
                  minLength="10"
                  maxLength="1000"
                  rows="4"
                  value={reportForm.details}
                  onChange={(event) => setReportForm({ ...reportForm, details: event.target.value })}
                  placeholder="Describe the issue so our team can review it."
                />
              </label>
              <button className="service-submit" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send report"}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedConversation && (
        <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedConversation(null);
        }}>
          <section className="service-conversation-modal" role="dialog" aria-modal="true" aria-labelledby="service-conversation-title">
            <button className="service-modal-close" type="button" aria-label="Close conversation" onClick={() => setSelectedConversation(null)}>×</button>
            <p className="service-eyebrow">PRIVATE SERVICE CONVERSATION</p>
            <h2 id="service-conversation-title">{selectedConversation.service.title}</h2>
            <p>{selectedConversation.provider.businessName} · {selectedConversation.location}</p>
            {conversationError && <p className="service-error">{conversationError}</p>}
            <div className="service-message-list" aria-live="polite">
              {conversationLoading && conversationMessages.length === 0 && <p className="service-state">Loading messages...</p>}
              {!conversationLoading && conversationMessages.length === 0 && <p className="service-state">No messages yet. Start the conversation with the other participant.</p>}
              {conversationMessages.map((message) => (
                <article className={`service-message ${message.sender.id === user?.id ? "own" : "other"}`} key={message.id}>
                  <div><strong>{message.sender.name}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></div>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
            {conversationBlocked ? (
              <div className="conversation-blocked-notice" role="status">
                {blockedByMe
                  ? "You blocked this account. New messages and service requests between you are disabled. This conversation remains available."
                  : "This account blocked you. New messages and service requests between you are disabled. This conversation remains available."}
                {blockedByMe && (
                  <button type="button" className="unblock-participant-button" disabled={blockingUser} onClick={handleUnblockParticipant}>
                    {blockingUser ? "Unblocking..." : "Unblock this account"}
                  </button>
                )}
              </div>
            ) : (
              <>
                {confirmBlock ? (
                  <div className="conversation-block-confirm" role="alertdialog" aria-label="Confirm account block">
                    <p>Blocking applies to all service requests between these accounts. Existing conversations remain available, but neither of you can send messages or create new service requests.</p>
                    <div>
                      <button type="button" className="confirm-block-button" disabled={blockingUser} onClick={handleBlockParticipant}>
                        {blockingUser ? "Blocking..." : "Confirm block"}
                      </button>
                      <button type="button" className="cancel-block-button" onClick={() => setConfirmBlock(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="block-participant-button" onClick={() => setConfirmBlock(true)}>
                    Block this account
                  </button>
                )}
                {!confirmBlock && (
                  <form className="service-message-form" onSubmit={handleSendMessage}>
                    <label htmlFor="service-message-draft">Message</label>
                    <textarea
                      id="service-message-draft"
                      required
                      maxLength="2000"
                      rows="3"
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder="Write a message to the customer or provider."
                    />
                    <button className="service-submit" type="submit" disabled={messageSending || !messageDraft.trim()}>
                      {messageSending ? "Sending..." : "Send message"}
                    </button>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Services;