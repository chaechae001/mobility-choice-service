import Image from "next/image";
import { useState } from "react";
import { getVehicleName } from "./vehicleUtils";
import styles from "./VehicleResults.module.css";

export default function VehicleImage({
                                         vehicle,
                                         sizes = "(max-width: 850px) 100vw, 50vw",
                                         imageClassName = "",
                                     }) {
    const [hasError, setHasError] = useState(false);

    const imageUrl =
        vehicle.imageUrl ??
        vehicle.thumbnail ??
        vehicle.mainImage ??
        vehicle.images?.[0];

    if (!imageUrl || hasError) {
        return (
            <div className={styles.imageFallback}>
                <span>{vehicle.brand}</span>
                <strong>{getVehicleName(vehicle)}</strong>
            </div>
        );
    }

    return (
        <Image
            className={imageClassName}
            src={imageUrl}
            alt={`${vehicle.brand} ${getVehicleName(vehicle)}`}
            fill
            unoptimized
            sizes={sizes}
            onError={() => setHasError(true)}
        />
    );
}