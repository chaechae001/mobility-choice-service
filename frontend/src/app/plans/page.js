"use client";

// 브라우저에서 실행되는 화면입니다.
// localStorage, 클릭 이벤트, useState를 사용하므로 필요합니다.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlansPage() {
    // plans: 백엔드에서 받은 선택 계획 목록을 저장합니다.
    const [plans, setPlans] = useState([]);

    // loading: 목록을 불러오는 중인지 나타냅니다.
    const [loading, setLoading] = useState(true);

    // message: 오류나 안내 문구를 화면에 표시합니다.
    const [message, setMessage] = useState("");

    // 코드로 다른 페이지로 이동할 때 사용합니다.
    const router = useRouter();

    // 화면이 처음 열릴 때 한 번 실행됩니다.
    useEffect(() => {
        fetchPlans();
    }, []);

    // 내 모빌리티 선택 계획 목록을 불러오는 함수입니다.
    async function fetchPlans() {
        // 로그인 화면에서 localStorage에 저장한 JWT를 가져옵니다.
        const token = localStorage.getItem("token");

        // 토큰이 없다는 것은 로그인하지 않았다는 의미입니다.
        if (!token) {
            router.push("/");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/plans`,
                {
                    method: "GET",
                    headers: {
                        // JWT가 필요한 API이므로 Authorization 헤더에 토큰을 넣습니다.
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            // 토큰 만료, 잘못된 토큰, 서버 오류 등을 처리합니다.
            if (!response.ok) {
                setMessage(data.message || "선택 계획을 불러오지 못했습니다.");
                return;
            }

            // 백엔드에서 받은 배열을 plans 상태에 저장합니다.
            setPlans(data);
        } catch (error) {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            // 성공/실패와 상관없이 로딩 상태를 종료합니다.
            setLoading(false);
        }
    }

    // 로그아웃: 브라우저에 저장한 JWT를 삭제합니다.
    function handleLogout() {
        localStorage.removeItem("token");
        router.push("/");
    }

    // 계획 하나를 클릭하면 상세 페이지로 이동합니다.
    function handlePlanClick(planId) {
        router.push(`/plans/${planId}`);
    }

    if (loading) {
        return <main>모빌리티 선택 계획을 불러오는 중입니다...</main>;
    }

    return (
        <main>
            <h1>나의 모빌리티 선택 계획</h1>
            <p>생활패턴과 예산에 맞는 차량·이용방식 선택을 정리해보세요.</p>

            <Link href="/plans/new">새 선택 계획 작성</Link>

            <button onClick={handleLogout}>로그아웃</button>

            {message && <p>{message}</p>}

            {plans.length === 0 ? (
                <p>아직 작성한 모빌리티 선택 계획이 없습니다.</p>
            ) : (
                <section>
                    {plans.map((plan) => (
                        <article
                            key={plan._id}
                            onClick={() => handlePlanClick(plan._id)}
                            style={{
                                border: "1px solid #cccccc",
                                padding: "16px",
                                marginTop: "16px",
                                cursor: "pointer",
                            }}
                        >
                            <h2>{plan.title}</h2>

                            <p>이용 목적: {plan.purpose}</p>
                            <p>예산: {plan.budget?.toLocaleString()}만 원</p>
                            <p>희망 이용 방식: {plan.preferredUsageType || "미정"}</p>
                            <p>조회수: {plan.views}</p>

                            <p>
                                작성일:{" "}
                                {new Date(plan.createdAt).toLocaleDateString("ko-KR")}
                            </p>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}