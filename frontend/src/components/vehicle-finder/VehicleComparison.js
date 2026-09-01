import VehicleImage from "./VehicleImage";
import {
    formatPrice,
    getVehicleId,
    getVehicleName,
    getVehiclePrice,
    readArray,
} from "./vehicleUtils";
import styles from "./VehicleResults.module.css";

export default function VehicleComparison({
                                              selectedVehicles,
                                              onClear,
                                          }) {
    if (selectedVehicles.length < 2) {
        return null;
    }

    return (
        <section
            id="vehicle-comparison"
            className={styles.comparisonSection}
        >
            <div className={styles.comparisonHeading}>
                <div>
                    <p>VEHICLE COMPARISON</p>
                    <h2>{selectedVehicles.length}대 차량 비교</h2>
                </div>

                <button type="button" onClick={onClear}>
                    비교 선택 해제
                </button>
            </div>

            <div className={styles.comparisonScroll}>
                <div
                    className={styles.comparisonTable}
                    style={{
                        "--vehicle-count": selectedVehicles.length,
                    }}
                >
                    <div className={styles.comparisonRow}>
                        <span>차량</span>

                        {selectedVehicles.map((vehicle) => (
                            <strong key={getVehicleId(vehicle)}>
                                {vehicle.brand} {getVehicleName(vehicle)}
                            </strong>
                        ))}
                    </div>

                    <div className={styles.comparisonRow}>
                        <span>이미지</span>

                        {selectedVehicles.map((vehicle) => (
                            <div
                                className={styles.comparisonImage}
                                key={getVehicleId(vehicle)}
                            >
                                <VehicleImage
                                    vehicle={vehicle}
                                    sizes="220px"
                                    imageClassName={styles.comparisonCarImage}
                                />
                            </div>
                        ))}
                    </div>

                    <div className={styles.comparisonRow}>
                        <span>시작 가격</span>

                        {selectedVehicles.map((vehicle) => (
                            <p key={getVehicleId(vehicle)}>
                                {formatPrice(getVehiclePrice(vehicle))}
                            </p>
                        ))}
                    </div>

                    <div className={styles.comparisonRow}>
                        <span>차종</span>

                        {selectedVehicles.map((vehicle) => (
                            <p key={getVehicleId(vehicle)}>
                                {vehicle.bodyType ?? "정보 확인 중"}
                            </p>
                        ))}
                    </div>

                    <div className={styles.comparisonRow}>
                        <span>동력 방식</span>

                        {selectedVehicles.map((vehicle) => (
                            <p key={getVehicleId(vehicle)}>
                                {vehicle.powertrain ?? "정보 확인 중"}
                            </p>
                        ))}
                    </div>

                    <div className={styles.comparisonRow}>
                        <span>탑승 인원</span>

                        {selectedVehicles.map((vehicle) => (
                            <p key={getVehicleId(vehicle)}>
                                {vehicle.seats
                                    ? `${vehicle.seats}인승`
                                    : "정보 확인 중"}
                            </p>
                        ))}
                    </div>

                    <div className={styles.comparisonRow}>
                        <span>주요 기능</span>

                        {selectedVehicles.map((vehicle) => {
                            const features = readArray(vehicle.features);

                            return (
                                <p key={getVehicleId(vehicle)}>
                                    {features.length > 0
                                        ? features.slice(0, 4).join(" · ")
                                        : "등록된 기능 정보 없음"}
                                </p>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}