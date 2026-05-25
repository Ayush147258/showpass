import type {
  User, Event, TicketTier, Order, Ticket,
  OrderItem, Review, Bookmark, DiscountCode,
  OrganiserProfile, Notification, RefundRequest,
  EventCategory, TicketTierType, OrderStatus, UserRole,
} from "@prisma/client";

// Re-export prisma enums
export type {
  EventCategory, TicketTierType, OrderStatus, UserRole,
};

// Extended types with relations
export type EventWithRelations = Event & {
  organiser: Pick<User, "id" | "name" | "image">;
  organiserProfile?: OrganiserProfile | null;
  ticketTiers: TicketTier[];
  _count: { registrations?: number; reviews: number };
  reviews?: Review[];
  isBookmarked?: boolean;
};

export type TicketWithRelations = Ticket & {
  tier: TicketTier & { event: Event };
  order: Pick<Order, "id" | "status" | "totalAmount">;
};

export type OrderWithRelations = Order & {
  buyer: Pick<User, "id" | "name" | "email" | "image">;
  event: Event & { organiser: Pick<User, "id" | "name"> };
  orderItems: (OrderItem & { tier: TicketTier })[];
  tickets: Ticket[];
};

export type DashboardStats = {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  upcomingEvents: number;
  checkInRate: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  topEvent: { title: string; revenue: number } | null;
};

export type RevenueDataPoint = {
  date: string;
  revenue: number;
  tickets: number;
};

export type CheckInStats = {
  registered: number;
  checkedIn: number;
  byTier: Array<{
    tierName: string;
    registered: number;
    checkedIn: number;
  }>;
  recentCheckIns: Array<{
    attendeeName: string;
    tierName: string;
    checkedInAt: Date;
  }>;
};

export type CartItem = {
  tierId: string;
  tierName: string;
  tierType: TicketTierType;
  price: number;
  quantity: number;
  maxQuantity: number;
  eventId: string;
  eventTitle: string;
};

export type EventFilters = {
  category?: EventCategory;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  isFree?: boolean;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
