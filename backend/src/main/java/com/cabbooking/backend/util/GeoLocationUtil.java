package com.cabbooking.backend.util;

public final class GeoLocationUtil {

    // Mean radius of Earth in kilometers
    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoLocationUtil() {}

    /**
     * Calculates the great-circle distance between two geographic coordinates
     * using the Haversine formula.
     *
     * @param lat1 Latitude of point 1 in degrees
     * @param lon1 Longitude of point 1 in degrees
     * @param lat2 Latitude of point 2 in degrees
     * @param lon2 Longitude of point 2 in degrees
     * @return Distance in kilometers rounded to 2 decimal places
     */
    public static double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            throw new IllegalArgumentException("Coordinates cannot be null");
        }

        if (lat1 < -90.0 || lat1 > 90.0 || lat2 < -90.0 || lat2 > 90.0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90 degrees");
        }

        if (lon1 < -180.0 || lon1 > 180.0 || lon2 < -180.0 || lon2 > 180.0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180 degrees");
        }

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;
        return Math.round(distance * 100.0) / 100.0;
    }

    /**
     * Estimates travel duration in minutes based on distance and typical city speed (~30 km/h = 2 min/km).
     *
     * @param distanceKm Distance in kilometers
     * @return Estimated minutes (minimum 1 minute)
     */
    public static int estimateDurationMinutes(double distanceKm) {
        if (distanceKm <= 0) {
            return 1;
        }
        return (int) Math.max(1, Math.round(distanceKm * 2.0));
    }
}
