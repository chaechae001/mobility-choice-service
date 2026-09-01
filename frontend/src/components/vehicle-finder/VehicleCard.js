import VehicleImage from "./VehicleImage";
import {
    formatPrice,
    getVehicleId,
    getVehicleName,
    getVehicleOrigin,
    getVehiclePrice,
} from "./vehicleUtils";
import styles from "./VehicleResults.module.css";

export default function VehicleCard({
                                        vehicle,
                                        index,
                                        isSelectedForCompare,
                                        onToggleCompare,
                                        onMoveToDetail,
                                    }) {
    const vehicleId = getVehicleId(vehicle);
    const vehicleName = getVehicleName(vehicle);
    const price = getVehiclePrice(vehicle);

    const powertrain =
        vehicle.powertrain ??
        vehicle.fuelType ??
        vehicle.engineType ??
        "정보 확인 중";

    return (
        <article className={styles.vehicleCard}>
            <div className={styles.imageArea}>
                <VehicleImage vehicle={vehicle} />

                <div className={styles.rank}>
                    {String(index + 1).padStart(2, "0")}
                </div>

                <label className={styles.compareCheck}>
                    <input
                        type="checkbox"
                        checked={isSelectedForCompare}
                        onChange={() => onToggleCompare(vehicle)}
                    />
                    비교하기
                </label>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.brandLine}>
                    <span>{vehicle.brand}</span>
                    <span>{getVehicleOrigin(vehicle)}</span>
                </div>

                <h2>{vehicleName}</h2>
                <p className={styles.price}>{formatPrice(price)}</p>

                {vehicle.recommendationReasons.length > 0 && (
                    <div className={styles.reasonList}>
                        {vehicle.recommendationReasons
                            .slice(0, 3)
                            .map((reason) => (
                                <span key={reason}>{reason}</span>
                            ))}
                    </div>
                )}

                <div className={styles.specList}>
                    <span>
                        {vehicle.bodyType ??
                            vehicle.category ??
                            "차종 확인 중"}
                    </span>
                    <span>{powertrain}</span>
                    {vehicle.seats && <span>{vehicle.seats}인승</span>}
                </div>

                <button
                    type="button"
                    className={styles.detailButton}
                    onClick={() => onMoveToDetail(vehicle)}
                    disabled={!vehicleId}
                >
                    차량 자세히 보기
                    <span aria-hidden="true">→</span>
                </button>
            </div>
        </article>
    );
}