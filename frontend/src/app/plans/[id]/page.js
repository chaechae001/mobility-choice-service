'use client';

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";

export default function PlanDetailPage() {
    // useParams()
    // -> URL의 /plans/[id] 부분에서 실제 id값을 가져옴
    const params = useParams();
    const planId = params.id;

    const router = useRouter();

    // plan: 백엔드에서 불러온 선택 계획 한 개를 저장
    const [plan, setPlan] = useState(null);

    // 목록을 불러오는 동안 화면을 구분하기 위한 상태
    const [loading, setLoading] = useState(true);

    // 오류 메시지 표시
    const [message, setMessage] = useState("");

    // 삭제 요청이 진행 중인지 관리합니다.
    // 요청 중에는 삭제 버튼을 다시 누르지 못하게 합니다.
    const [isDeleting, setIsDeleting] = useState(false);

    // 개발 환경에서 useEffect가 두 번 실행되는 상황 막음
    // 상세 조회 API는 조회수를 증가시키므로 특히 필요
    const hasFetched = useRef(false);

    useEffect(()=>{
        // 같은 화면에서 API를 중복 호출하지 않음
        if (hasFetched.current) {
            return;
        }

        hasFetched.current = true;
        fetchPlan();
    }, [planId]);

    // 선택 계획 한 개를 불러오는 함수
    async function fetchPlan() {
        const token = localStorage.getItem("token");

        // 로그인하지 않았다면 로그인 화면으로 보냄
        if (!token) {
            router.push("/");
            return;
        }

        try {
            const response = await fetch (
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/plans/${planId}`,
                {
                    method: "GET",
                    headers: {
                        // JWT 인증이 필요한 API입니다.
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "선택 계획을 불러오지 못했습니다.");
                return;
            }

            // 백엔드에서 받은 선택 계획 객체를 저장
            setPlan(data);
        } catch (error) {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            setLoading(false);
        }
    }

    // 현재 보고 있는 선택 계획을 삭제하는 함수입니다.
    async function handleDelete() {
        // window.confirm()
        // → 브라우저가 제공하는 기본 확인창입니다.
        const shouldDelete = window.confirm(
            "이 모빌리티 선택 계획을 삭제할까요? 삭제한 데이터는 되돌릴 수 없습니다."
        );

        // 사용자가 '취소'를 눌렀다면 삭제 요청을 보내지 않습니다.
        if (!shouldDelete) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/");
            return;
        }

        setIsDeleting(true);
        setMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/plans/${planId}`,
                {
                    method: "DELETE",
                    headers: {
                        // 백엔드는 JWT를 확인해 작성자 본인만 삭제하도록 검증합니다.
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // 백엔드가 JSON 메시지를 보내지 않는 경우에도 오류가 나지 않게 처리합니다.
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setMessage(data.message || "선택 계획 삭제에 실패했습니다.");
                return;
            }

            // 삭제가 완료되면 목록 화면으로 이동합니다.
            router.push("/plans");
        } catch (error) {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            setIsDeleting(false);
        }
    }

    if (loading) {
        return <main>선택 계획을 불러오는 중입니다...</main>;
    }

    if (message) {
        return (
            <main>
                <p>{message}</p>
                <Link href="/plans">목록으로 돌아가기</Link>
            </main>
        );
    }

    if (!plan) {
        return null;
    }

    return (
        <main>
            <Link href="/plans">← 목록으로 돌아가기</Link>

            <h1>{plan.title}</h1>

            <Link href={`/plans/${plan._id}/edit`}>
                이 선택 계획 수정
            </Link>

            <br />
            <br />

            <button onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "삭제 중..." : "이 선택 계획 삭제"}
            </button>

            <section>
                <h2>기본 조건</h2>
                <p>이용 목적: {plan.purpose}</p>
                <p>예산: {plan.budget.toLocaleString()}만 원</p>
                <p>주요 탑승 인원: {plan.passengers || "미입력"}명</p>
                <p>희망 이용 방식: {plan.preferredUsageType || "미입력"}</p>
            </section>

            <section>
                <h2>이용 환경</h2>
                <p>주행 패턴: {plan.drivingPattern || "미입력"}</p>
                <p>주차 환경: {plan.parkingEnvironment || "미입력"}</p>
                <p>충전 환경: {plan.chargingEnvironment || "미입력"}</p>
            </section>

            <section>
                <h2>중요하게 생각하는 조건</h2>

                {plan.priorities?.length > 0 ? (
                    <ul>
                        {plan.priorities.map((priority) => (
                            <li key={priority}>{priority}</li>
                        ))}
                    </ul>
                ) : (
                    <p>미입력</p>
                )}
            </section>

            <section>
                <h2>추가 메모</h2>
                <p>{plan.notes || "미입력"}</p>
            </section>

            <section>
                <h2>기록 정보</h2>
                <p>조회수: {plan.views}</p>
                <p>
                    작성일: {new Date(plan.createdAt).toLocaleString("ko-KR")}
                </p>
                <p>
                    수정일: {new Date(plan.updatedAt).toLocaleString("ko-KR")}
                </p>
            </section>
        </main>
    );
}