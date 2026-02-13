import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  fetchEvents,
  getUpcomingEvents,
} from "../src/sheets/client";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { city, genre, type, status, upcoming, slug } = req.query;

    let events = await fetchEvents();

    // Single event by slug or id
    if (slug && typeof slug === "string") {
      const event = events.find((e) => e.slug === slug || e.id === slug);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      return res.status(200).json({ data: event });
    }

    // Filter by city
    if (city && typeof city === "string") {
      events = events.filter((e) => e.city_slug === city);
    }

    // Filter by genre/tag
    if (genre && typeof genre === "string") {
      const g = genre.toLowerCase();
      events = events.filter((e) =>
        e.genres.some((eg) => eg.toLowerCase() === g)
      );
    }

    // Filter by status
    if (status && typeof status === "string") {
      events = events.filter((e) => e.status === status);
    }

    // Filter by event type
    if (type && typeof type === "string") {
      events = events.filter((e) => e.event_type === type);
    }

    // Filter to upcoming only
    if (upcoming === "true" || upcoming === "1") {
      events = getUpcomingEvents(events);
    }

    // Sort: pinned first, then by date
    events.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return a.start_date.localeCompare(b.start_date);
    });

    return res.status(200).json({
      data: events,
      meta: { total: events.length },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
}
