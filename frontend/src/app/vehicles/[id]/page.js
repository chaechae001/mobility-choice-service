"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

// MongoDB에 저장한 가격은 "원" 단위입니다.
// 예: 30420000원 → 3,042만 원
function formatPrice(vehicle) {
    const priceFrom = Number(vehicle.priceFrom);
    const priceTo = Number(vehicle.priceTo);

    if (!Number.isFinite(priceFrom)) {
        return "가격 정보 확인 중";
    }

    const priceFromInManwon = Math.round(priceFrom / 10000);

    if (Number.isFinite(priceTo) && priceTo > priceFrom) {
        const priceToInManwon = Math.round(priceTo / 10000);

        return `${priceFromInManwon.toLocaleString(
            "ko-KR"
        )} ~ ${priceToInManwon.toLocaleString("ko-KR")}만 원`;
    }

    return `${priceFromInManwon.toLocaleString("ko-KR")}만 원부터`;
}

// 문자열 또는 배열을 항상 배열 형태로 바꿉니다.
function toArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim()) {
        return [value];
    }

    return [];
}

export default function VehicleDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    /*
     * 외부 제조사 이미지가 주소 변경·접근 제한 등으로 로드되지 않았을 때
     * 빈 이미지 대신 차량명 중심의 대체 화면을 보여주기 위한 상태입니다.
     */
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        async function loadVehicle() {
            const vehicleId = Array.isArray(params.id)
                ? params.id[0]
                : params.id;

            if (!vehicleId) {
                setErrorMessage("차량 정보를 찾을 수 없습니다.");
                setLoading(false);
                return;
            }

            const token = localStorage.getItem("token");

            if (!token) {
                setErrorMessage("로그인 정보가 없습니다. 다시 로그인해주세요.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setErrorMessage("");
            setImageFailed(false);

            try {
                const apiBaseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL ||
                    "http://localhost:4000";

                const response = await fetch(
                    `${apiBaseUrl}/api/vehicles/${vehicleId}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setErrorMessage(
                        data.message || "차량 정보를 불러오지 못했습니다."
                    );
                    return;
                }

                setVehicle(data);
            } catch (error) {
                console.error("차량 상세 조회 오류:", error);
                setErrorMessage("백엔드 서버와 연결할 수 없습니다.");
            } finally {
                setLoading(false);
            }
        }

        loadVehicle();
    }, [params.id]);

    if (loading) {
        return (
            <main className={styles.statePage}>
                <span className={styles.loader} />
                <p>차량 정보를 불러오고 있습니다.</p>
            </main>
        );
    }

    if (errorMessage || !vehicle) {
        return (
            <main className={styles.statePage}>
                <p className={styles.stateLabel}>VEHICLE DETAIL</p>
                <h1>차량 정보를 불러오지 못했습니다.</h1>
                <p>{errorMessage}</p>

                <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => router.push("/vehicles")}
                >
                    차량 목록으로 돌아가기
                </button>
            </main>
        );
    }

    const vehicleName =
        vehicle.model ||
        vehicle.modelName ||
        vehicle.name ||
        "차량명 확인 중";

    const features = toArray(vehicle.features);

    const specifications =
        Array.isArray(vehicle.specifications) &&
        vehicle.specifications.length > 0
            ? vehicle.specifications
            : [
                {
                    label: "차종",
                    value: vehicle.bodyType || "정보 확인 중",
                },
                {
                    label: "동력 방식",
                    value: vehicle.powertrain || "정보 확인 중",
                },
                {
                    label: "탑승 인원",
                    value: vehicle.seats
                        ? `${vehicle.seats}인승`
                        : "정보 확인 중",
                },
            ];

    /*
     * vehicles.js의 imageUrl을 우선 사용합니다.
     * 이전 데이터와 호환하기 위해 image, thumbnail도 함께 확인합니다.
     */
    const imageUrl =
        vehicle.imageUrl ||
        vehicle.image ||
        vehicle.thumbnail ||
        "";

    const description =
        vehicle.description ||
        `${vehicleName}는 ${vehicle.brand}의 ${vehicle.bodyType} 차량입니다. ${
            vehicle.priceNote
                ? `${vehicle.priceNote} 기준 가격 정보입니다.`
                : ""
        }`;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <button
                    type="button"
                    className={styles.logo}
                    onClick={() => router.push("/")}
                >
                    MOBILITY CHOICE
                </button>

                <button
                    type="button"
                    className={styles.listButton}
                    onClick={() => router.push("/vehicles")}
                >
                    차량 목록
                </button>
            </header>

            <section className={styles.hero}>
                <div className={styles.heroInfo}>
                    <p className={styles.brand}>{vehicle.brand}</p>

                    <h1>{vehicleName}</h1>

                    <p className={styles.price}>{formatPrice(vehicle)}</p>

                    {vehicle.priceNote && (
                        <p className={styles.priceNote}>
                            {vehicle.priceNote}
                        </p>
                    )}

                    <div className={styles.tags}>
                        {vehicle.bodyType && <span>{vehicle.bodyType}</span>}
                        {vehicle.powertrain && (
                            <span>{vehicle.powertrain}</span>
                        )}
                        {vehicle.seats && <span>{vehicle.seats}인승</span>}
                        {vehicle.origin && <span>{vehicle.origin}</span>}
                    </div>
                </div>

                <div className={styles.vehicleVisual}>
                    {imageUrl && !imageFailed ? (
                        <img
                            src={imageUrl}
                            alt={`${vehicle.brand} ${vehicleName}`}
                            className={styles.vehicleImage}
                            referrerPolicy="no-referrer"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <div className={styles.imageFallback}>
                            <span>{vehicle.brand}</span>
                            <strong>{vehicleName}</strong>
                            <p>공식 차량 이미지를 준비하고 있습니다.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className={styles.contentGrid}>
                <article className={styles.infoCard}>
                    <p className={styles.cardLabel}>BASIC INFO</p>
                    <h2>기본 정보</h2>

                    <dl className={styles.specTable}>
                        {specifications.map((specification) => (
                            <div key={specification.label}>
                                <dt>{specification.label}</dt>
                                <dd>{specification.value}</dd>
                            </div>
                        ))}
                    </dl>
                </article>

                <article className={styles.infoCard}>
                    <p className={styles.cardLabel}>KEY FEATURES</p>
                    <h2>주요 기능</h2>

                    {features.length > 0 ? (
                        <>
                            <div className={styles.featureList}>
                                {features.map((feature) => (
                                    <span key={feature}>{feature}</span>
                                ))}
                            </div>

                            {vehicle.featureNote && (
                                <p className={styles.featureNote}>
                                    {vehicle.featureNote}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className={styles.emptyText}>
                            공식 출처에서 확인한 공통 기능을 순차적으로
                            추가하고 있습니다.
                        </p>
                    )}
                </article>

                <article
                    className={`${styles.infoCard} ${styles.descriptionCard}`}
                >
                    <p className={styles.cardLabel}>DESCRIPTION</p>
                    <h2>차량 설명</h2>
                    <p className={styles.description}>{description}</p>
                </article>
            </section>

            <section className={styles.sourceSection}>
                <div>
                    <p>차량 정보 출처</p>
                    <span>
                        기준일:{" "}
                        {vehicle.sourceCheckedAt
                            ? new Date(
                                vehicle.sourceCheckedAt
                            ).toLocaleDateString("ko-KR")
                            : "정보 확인 중"}
                    </span>
                </div>

                <a
                    href={vehicle.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    공식 정보 보기
                    <span aria-hidden="true">↗</span>
                </a>
            </section>
        </main>
    );
}