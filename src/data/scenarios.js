export const SCENARIOS = [
  {
    id: "sc1", role: "주니어 백엔드 개발자", brief: "금요일 저녁 피크타임에 주문 서비스가 죽기 시작했습니다. 3만 명의 고객이 주문을 못 하고 있습니다.", why: "MSA 장애 대응은 이커머스 면접의 1번 질문입니다. '서킷브레이커가 뭔가요?'에 실전 경험 없이 답하면 바로 탈락합니다.", title: "금요일 피크타임, 주문이 사라지고 있다",
    company: "먹방라이브 — MAU 1,200만 라이브 커머스 플랫폼",
    tags: ["Cascading Failure", "서킷브레이커", "MSA"], diff: "중급", dur: "12분", cat: "장애 대응", icon: "🔥", clr: "#ef4444",
    nodes: {
      start: {
        time: "19:03", title: "장애 인지", phase: "investigate",
        nar: ["금요일 저녁 7시, 라이브 특가·한정 쿠폰이 겹친 피크. 체크아웃이 터지는 순간 모바일 앱 리뷰에도 '결제만 돌다 끊긴다' 댓글이 붙기 시작합니다.", "갑자기 #incident-alert가 **초당 수십 건** 쏟아지고, CS 대기열이 평소의 **30배**로 불어납니다."],
        alerts: [
          { level: "critical", msg: "order-service p99 응답시간 12,400ms" },
          { level: "critical", msg: "Eureka: order-service 인스턴스 3/4 DOWN" },
          { level: "warning", msg: "payment-service 타임아웃 에러율 47%" }
        ],
        clues: {
          prompt: "어떤 정보를 먼저 확인하시겠습니까?",
          options: [
            { id: "log", label: "📋 애플리케이션 로그", content: [
              { t: "19:03:01", lv: "error", m: "HikariPool-1 - Connection not available, timed out after 30000ms" },
              { t: "19:03:02", lv: "error", m: "FeignClient delivery-service Read timed out 10000ms" },
              { t: "19:03:03", lv: "warn", m: "CircuitBreaker deliveryService is OPEN (failure rate: 87%)" }
            ]},
            { id: "metric", label: "📊 Grafana 메트릭", metrics: [
              { l: "주문 성공률", v: "23%", s: "danger", u: "99.7% → 23%" },
              { l: "활성 인스턴스", v: "1/4", s: "danger", u: "3개 DOWN" },
              { l: "DB 커넥션 풀", v: "50/50", s: "danger", u: "완전 고갈" }
            ]},
            { id: "trace", label: "🔍 Zipkin 트레이스", trace: {
              title: "POST /api/orders — 12,400ms",
              lines: [
                { indent: 0, text: "POST /api/orders", time: "12,400ms", status: "error" },
                { indent: 1, text: "DB: INSERT p_orders", time: "35ms", status: "ok" },
                { indent: 1, text: "FeignClient -> delivery-service", time: "10,000ms", status: "error", note: "TIMEOUT" },
                { indent: 1, text: "FeignClient -> notification-service", time: "SKIPPED", status: "error" },
                { indent: 1, text: "Transaction ROLLBACK", time: "", status: "error" }
              ]
            }}
          ]
        },
        timer: 45,
        freeFirst: "이 상황에서 가장 먼저 해야 할 행동은 무엇이라고 생각하시나요? 선택지를 보기 전에 본인의 생각을 적어보세요.",
        q: "장애를 인지한 직후, 가장 먼저 해야 할 행동은?",
        hint: "원인을 모르는 상태에서 시스템을 변경하면 어떻게 될까요?",
        ch: [
          { id: "A", text: "즉시 인스턴스 재시작", desc: "kubectl rollout restart로 복구 시도", g: "bad", nx: "step2_bad",
            impact: { "주문 성공률": "0%", "활성 인스턴스": "0/4", "상황": "완전 중단" } },
          { id: "B", text: "팀에 장애 선언하고 로그/메트릭 분석", desc: "#incident 공유, Incident Commander 지정, 원인 분석", g: "best", nx: "step2",
            impact: { "주문 성공률": "23%", "활성 인스턴스": "1/4", "상황": "유지 (분석 중)" } },
          { id: "C", text: "Gateway에서 주문 API 트래픽 차단", desc: "/api/orders 라우트 비활성화", g: "ok", nx: "step2",
            impact: { "주문 성공률": "0%", "활성 인스턴스": "1/4", "상황": "의도적 차단" } }
        ],
        fb: {
          A: { t: "🔴 상황 악화", b: "재시작 중 남은 인스턴스까지 DOWN. **원인 파악 없이 재시작하면 같은 문제로 다시 죽습니다.**", cost: "다운타임이 길어질수록 **GMV·정산·셀러 정산**까지 동시에 흔들립니다.", r: "2022년 한 대형 커머스에서 성급한 재시작으로 30분 장애가 2시간으로 확대." },
          B: { t: "🟢 정확한 첫 대응!", b: "장애 대응 첫 단계: ① 팀 공유 ② 로그/메트릭 확인 ③ Incident Commander 지정. **혼자 판단하지 않는 것**이 핵심.", cost: "분석에 **5~10분** 걸려 보여도, 잘못된 조치 하나보다 **훨씬 싼 보험**입니다.", r: "토스, 배달의민족 등은 장애 대응 매뉴얼(Runbook)에서 첫 단계는 항상 상황 공유." },
          C: { t: "🟡 비즈니스 피해 큼", b: "전체 차단 시 **모든 고객 주문 불가**. 원인 파악 후 부분적 트래픽 제어가 더 현명합니다.", cost: "피크 **시간당 매출**을 통째로 포기하는 셈이라, 브랜드·셀러 모두에게 **2차 폭탄**이 됩니다.", r: "" }
        },
        tradeoff: [
          { option: "재시작", time: "1분", risk: "매우 높음", dataLoss: "진행중 주문 유실", note: "원인 미파악 시 재발" },
          { option: "팀 공유+분석", time: "5~10분", risk: "낮음", dataLoss: "없음", note: "가장 안전한 첫 대응" },
          { option: "트래픽 차단", time: "즉시", risk: "중간", dataLoss: "없음", note: "비즈니스 피해 큼" }
        ]
      },
      step2_bad: {
        time: "19:10", title: "상황 악화 — 서비스 완전 중단", phase: "action",
        nar: ["인스턴스 재시작 중 남은 1개까지 DOWN. **주문 서비스 완전 중단. 7분 동안 라이브 방송 중인 셀러 매출이 그대로 증발**했습니다.", "이제라도 원인을 파악해야 합니다. Zipkin을 확인하니 **FeignClient 동기 호출이 전체를 블로킹**하고 있었습니다."],
        clues: {
          prompt: "긴급 완화 전, 구조적 병목을 다시 확인합니다. 어떤 단서를 열어볼까요?",
          options: [
            { id: "thread", label: "📋 스레드 / 커넥션 풀", content: [
              { t: "19:10", lv: "error", m: "http-nio-exec: 200/200 BLOCKED — Feign delivery read pending" },
              { t: "19:10", lv: "warn", m: "HikariPool: 0 idle — 모든 요청이 긴 트랜잭션에 묶임" }
            ]},
            { id: "zip", label: "🔍 Zipkin — 병목 구간", trace: {
              title: "POST /api/orders",
              lines: [
                { indent: 0, text: "order-service total", time: "timeout", status: "error" },
                { indent: 1, text: "Feign -> delivery-service", time: "10,000ms", status: "error", note: "BLOCK" },
                { indent: 1, text: "Feign -> notification", time: "SKIPPED", status: "error" }
              ]
            }},
            { id: "mit", label: "📊 완화 수단 가용성", metrics: [
              { l: "Resilience4j CB", v: "미적용", s: "danger", u: "배포 파이프라인에 없음" },
              { l: "스케일아웃", v: "가능", s: "warning", u: "동일 블로킹이면 효과 제한" }
            ]}
          ]
        },
        freeFirst: "7분을 잃은 뒤입니다. **지금 즉시** 주문을 다시 받으려면 무엇이 1순위인가요? 스케일아웃만으로는 부족한 이유를 한두 문장으로 적어보세요.",
        slack: { name: "CTO 박서연", time: "19:10", body: "지금 라이브 방송 **200개 넘게** 떠 있는데 주문이 싹 멈췄대요. 재시작했다더니 왜 더 망가진 거예요? 숫자로만 짧게 부탁해요." },
        met: [
          { l: "주문 성공률", v: "0%", s: "danger", u: "완전 중단" },
          { l: "손실 시간", v: "7분", s: "danger", u: "불필요한 지연" }
        ],
        timer: 20,
        q: "7분을 잃었습니다. 지금부터 어떻게 하시겠습니까?",
        ch: [
          { id: "A", text: "서킷 브레이커(Resilience4j) + Fallback 적용", desc: "외부 호출 실패 시 fallback으로 주문은 성공, 나머지는 보상 처리", g: "best", nx: "step2_bad_aftermath",
            impact: { "주문 성공률": "89%", "추가 손실": "7분간 전체 중단분", "복구 시간": "15분" } },
          { id: "B", text: "인스턴스를 10개로 늘려 재시작", desc: "더 많은 인스턴스로 분산", g: "bad", nx: "step2_bad_aftermath",
            impact: { "주문 성공률": "0% (변화없음)", "추가 손실": "계속 증가", "복구 시간": "불확실" } }
        ],
        fb: {
          A: { t: "🟢 늦었지만 올바른 판단", b: "7분의 시간을 잃었지만, 이제라도 **정확한 조치**를 취한 것이 중요합니다. 현업에서 'panic-driven debugging'은 장애 대응의 최악 패턴입니다.", cost: "서킷+fallback 이후에도 **미처리 배송·알림**은 보상 트랜잭션으로 따로 정리해야 합니다.", r: "" },
          B: { t: "🔴 같은 실수 반복", b: "10개 인스턴스 모두 **같은 문제로 블로킹**됩니다. 구조적 문제 앞에서 수평 확장은 무력합니다.", cost: "인스턴스 비용만 늘고 **장애 시간은 연장**될 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "서킷 브레이커", time: "15분", risk: "낮음", dataLoss: "보상 필요", note: "7분 지연 후 최선" },
          { option: "스케일아웃", time: "불확실", risk: "높음", dataLoss: "계속 증가", note: "근본 해결 안됨" }
        ]
      },
      step2_bad_aftermath: {
        time: "19:15", title: "7분의 대가 — 피해 수습", phase: "action",
        nar: ["서비스가 다시 살아나고 있지만, **7분간의 완전 중단** 동안 약 **4,200건의 주문이 유실**됐고, 일부 고객은 **결제만 되고 주문 내역이 비어** SNS에 캡처를 올리기 시작했습니다.", "CTO 박서연님이 전체 인시던트 채널에 메시지를 남겼습니다."],
        clues: {
          prompt: "고객·법무·CS 관점의 정보를 더 확인합니다.",
          options: [
            { id: "legal", label: "📋 약관 / 환불 정책", content: [
              { t: "", lv: "info", m: "결제 완료 후 주문 미생성 → '미이행' 분쟁 시 전액 환불 + 위약 가능" },
              { t: "", lv: "warn", m: "공지만으로는 집단 민원·공정위 리스크 — 개별 증빙 권장" }
            ]},
            { id: "cs", label: "📞 CS 큐", metrics: [
              { l: "대기 통화", v: "1,200+", s: "danger", u: "평소 대비 40배" },
              { l: "SNS 멘션", v: "급증", s: "warning", u: "실시간 모니터링 중" }
            ]},
            { id: "db", label: "🗃 유실 추적 가능성", content: [
              { t: "", lv: "warn", m: "Kafka outbox 일부만 기록 — 100% 복구는 불가, 로그 기반 역추적 필요" },
              { t: "", lv: "info", m: "결제 PG 로그와 order_id 매칭 스크립트 준비 중" }
            ]}
          ]
        },
        freeFirst: "유실 4,200건이 있습니다. **기술 복구**와 별개로, 고객·브랜드 측면에서 가장 먼저 챙겨야 할 것은 무엇인가요? (한두 문장)",
        slack: { name: "CTO 박서연", time: "19:15", body: "7분이면 라이브 커머스에선 영원이에요. 유실 **4,200건** 보상안이랑, 왜 첫 대응이 꼬였는지 **포스트모템에 반드시** 넣어주세요. 지금은 복구 먼저고, 내일 오전까지 초안 공유 부탁합니다." },
        met: [
          { l: "유실 주문", v: "~4,200건", s: "danger", u: "7분간 전체 중단" },
          { l: "예상 매출 손실", v: "~4.6억", s: "danger", u: "시간당 4억 기준" },
          { l: "현재 상태", v: "복구 중", s: "warning", u: "서킷브레이커 적용됨" }
        ],
        timer: 25,
        q: "복구가 진행 중입니다. 유실된 주문에 대해 어떻게 대응하시겠습니까?",
        ch: [
          { id: "A", text: "유실 주문 DB 로그 추출 → 고객에게 재주문 안내 + 보상 쿠폰", desc: "영향받은 고객 식별 후 개별 연락, 보상 쿠폰 발급", g: "best", nx: "step3",
            impact: { "고객 신뢰": "회복 가능", "추가 비용": "쿠폰 비용", "시간": "1~2시간" } },
          { id: "B", text: "공지사항만 올리고 별도 대응하지 않음", desc: "일괄 공지로 대체", g: "bad", nx: "step3",
            impact: { "고객 신뢰": "추가 하락", "추가 비용": "없음", "시간": "10분" } }
        ],
        fb: {
          A: { t: "🟢 고객 중심 대응", b: "장애는 기술 문제이자 **고객 경험 문제**입니다. 영향 고객을 식별하고 선제적으로 보상하는 것이 신뢰 회복의 핵심입니다.", cost: "쿠폰·환불 비용과 **CS·법무 인력**이 당분간 풀로 들어갑니다.", r: "배달의민족, 쿠팡 등은 장애 시 영향 고객에게 자동 보상 시스템을 운영합니다." },
          B: { t: "🔴 2차 피해", b: "4,200명의 고객이 **주문이 사라진 것도 모른 채** 방치됩니다. SNS 확산 시 브랜드 피해가 장애보다 더 클 수 있습니다.", cost: "단기 비용은 없어 보여도 **이탈·소송·언론** 비용이 훨씬 큽니다.", r: "" }
        },
        tradeoff: [
          { option: "개별 보상", time: "1~2시간", risk: "낮음", dataLoss: "없음", note: "신뢰 회복" },
          { option: "공지만", time: "10분", risk: "높음", dataLoss: "없음", note: "2차 피해 가능" }
        ]
      },
      step2: {
        time: "19:08", title: "긴급 조치 선택", phase: "action",
        nar: ["분석 결과: 주문 생성 시 **4개 외부 서비스를 FeignClient로 동기 호출**하고, 피크에 배송 ETA 조회만 **10초** 넘게 걸립니다.", "delivery-service 지연이 order-service 스레드를 블로킹 — **Cascading Failure**로 주문 성공률이 **99%대에서 20%대**로 붕괴했습니다."],
        clues: {
          prompt: "20분 안 완화를 위해 제약·옵션을 확인합니다.",
          options: [
            { id: "sla", label: "⏱ SLA / 배포", content: [
              { t: "19:07", lv: "warn", m: "Feature branch: CB+Resilience4j — 코드 리뷰 대기 2h (지금은 불가)" },
              { t: "19:08", lv: "info", m: "Hotfix 브랜치: @CircuitBreaker + fallback 메서드만 추가 — 빌드 8분" }
            ]},
            { id: "biz", label: "📋 비즈니스 완화", content: [
              { t: "", lv: "info", m: "CTO: 배송·알림은 **비동기·수동** 처리 가능 — 주문 생성만 살리면 됨" },
              { t: "", lv: "warn", m: "Kafka 신규 클러스터는 **당일 내 구축 불가**" }
            ]},
            { id: "risk", label: "📊 선택지 리스크", metrics: [
              { l: "핫픽스 주석", v: "높음", s: "danger", u: "추적 누락" },
              { l: "서킷+fallback", v: "중간", s: "warning", u: "보상 트랜잭션 필요" }
            ]}
          ]
        },
        freeFirst: "20분 제한이 있습니다. **완벽한 비동기화**와 **당장 주문 살리기** 중 지금 선택해야 하는 것은 무엇인가요? 그 근거를 적어보세요.",
        slack: { name: "CTO 박서연", time: "19:08", body: "공유 고마워요. 지금 피크 **시간당 매출 4억** 기준인데 거의 **3억 가까이** 날아가고 있어요. **20분 안에** 체크아웃이라도 살려주세요. 배송·알림은 오늘 밤에 수동으로 메울게요." },
        timer: 30,
        q: "CTO: 20분 안에 주문을 살려주세요. 긴급 조치를 선택하세요.",
        hint: "완벽한 해결과 서비스 복구는 다릅니다. 배송/알림은 나중에 처리할 수 있습니다.",
        ch: [
          { id: "A", text: "서킷 브레이커(Resilience4j) + Fallback 적용", desc: "외부 호출 실패 시 fallback으로 주문은 성공시키고 나머지는 보상 처리", g: "best", nx: "step3",
            impact: { "주문 성공률": "94%", "미처리 배송": "약 2,400건", "복구 시간": "15분" } },
          { id: "B", text: "FeignClient 호출 주석 처리 후 핫픽스", desc: "가장 빠른 방법. 호출 제거 후 즉시 배포", g: "ok", nx: "step3",
            impact: { "주문 성공률": "91%", "미처리 배송": "추적 불가", "복구 시간": "10분" } },
          { id: "C", text: "Kafka로 비동기 전환 코드 작성", desc: "근본적 해결. 주문은 동기, 나머지는 비동기", g: "bad", nx: "step3",
            impact: { "주문 성공률": "23% (변화없음)", "미처리 배송": "계속 증가", "복구 시간": "2~3일" } }
        ],
        fb: {
          A: { t: "🟢 현업 최적 대응!", b: "Resilience4j는 **어노테이션 + fallback 메서드**로 15분 내 적용 가능. 미처리 건은 **보상 트랜잭션**으로 처리.", cost: "fallback 이후 **배송·알림 정합성**을 맞추는 배치·모니터링이 추가로 필요합니다.", r: "Netflix, 쿠팡 등은 모든 외부 호출에 서킷 브레이커 기본 적용." },
          B: { t: "🟡 빠르지만 리스크", b: "어떤 주문에 배송이 빠져있는지 **추적이 어려움**. 복구 계획 없이 하면 2차 장애.", cost: "데이터 팀이 **주문-배송 불일치 리포트**를 다음날까지 수작업으로 맞춰야 할 수 있습니다.", r: "" },
          C: { t: "🔴 타이밍이 아님", b: "Kafka 도입은 **브로커 설치, 토픽 설계, 구현, 테스트**까지 최소 2~3일. 20분 안에 불가능. 이건 포스트모템 이후 장기 개선안.", cost: "장기적으로는 정답에 가깝지만 **당일 매출·고객**은 회복 못 합니다.", r: "현업에서 긴급 대응(Mitigation)과 근본 해결(Fix)은 명확히 분리합니다." }
        },
        tradeoff: [
          { option: "서킷 브레이커", time: "15분", risk: "낮음", dataLoss: "보상 처리 필요", note: "현업 표준 대응" },
          { option: "주석 처리 핫픽스", time: "10분", risk: "중간", dataLoss: "추적 어려움", note: "빠르지만 위험" },
          { option: "Kafka 전환", time: "2~3일", risk: "낮음", dataLoss: "없음 (완료 후)", note: "장기 개선안" }
        ]
      },
      step3: {
        time: "다음 날", title: "포스트모템 — 재발 방지", phase: "postmortem",
        nar: ["서비스 복구는 끝났고, 셀러·정산팀이 **어제 피크 손실 추정**을 물어오는 가운데 포스트모템에서 장기 개선안을 제시합니다."],
        clues: {
          prompt: "포스트모템에서 참고할 근거 자료를 열어보세요.",
          options: [
            { id: "retro", label: "📋 어제 타임라인", content: [
              { t: "", lv: "info", m: "19:03 장애 인지 → 19:10 잘못된 재시작 → 19:15 완화" },
              { t: "", lv: "warn", m: "피크 전 **부하 테스트 미실시** — 프로모션 일정과 겹침" }
            ]},
            { id: "cost", label: "📊 비용·영향", metrics: [
              { l: "매출 손실", v: "수십억+", s: "danger", u: "추정" },
              { l: "재발 시 브랜드", v: "치명적", s: "danger", u: "경쟁사 이탈" }
            ]},
            { id: "team", label: "👥 조직", content: [
              { t: "", lv: "info", m: "Runbook: 외부 호출 장애 시 **서킷 오픈 조건** 미정의" },
              { t: "", lv: "warn", m: "온콜 로테이션은 있으나 **에러율 알림 임계치** 미설정" }
            ]}
          ]
        },
        freeFirst: "CTO가 경영진 브리핑에 올릴 **장애 보고서 요약 3줄**을 작성해주세요. [장애 원인] [비즈니스 영향] [재발 방지 대책]을 포함해야 합니다.",
        q: "장기 개선안을 선택하세요.",
        ch: [
          { id: "A", text: "비동기 전환(Kafka) + 서킷 브레이커 상시 적용", desc: "이벤트 기반 전환, 모든 외부 호출에 방어 장치", g: "ok", nx: "end" },
          { id: "B", text: "A + 오토스케일링 + 부하 테스트 + Runbook", desc: "아키텍처+인프라+프로세스 종합 개선", g: "best", nx: "end" },
          { id: "C", text: "MSA를 모놀리식으로 되돌림", desc: "통신 복잡성이 문제이므로 다시 합침", g: "bad", nx: "end" }
        ],
        fb: {
          A: { t: "🟢 핵심을 짚었습니다", b: "비동기 전환은 필수. 하지만 인프라와 프로세스 개선도 병행해야 더 견고합니다.", cost: "Kafka·이벤트 스키마·소비자 장애 대응까지 포함하면 **프로젝트 기간·인력**이 꽤 필요합니다.", r: "" },
          B: { t: "🟢 시니어의 관점!", b: "**아키텍처+인프라+프로세스** 세 축 모두 개선. 부하 테스트는 프로모션 전 필수, Runbook은 다음 장애 대응 시간을 줄여줍니다.", cost: "초기 구축 비용은 크지만 **반복 장애 비용**을 줄이는 데 가장 효과적입니다.", r: "네이버, 카카오, 토스 등은 정기 부하 테스트와 Runbook을 운영합니다." },
          C: { t: "🔴 후퇴가 답은 아닙니다", b: "핵심은 MSA냐 모놀리식이냐가 아니라 **서비스 간 통신 설계**입니다.", cost: "모놀리식 복귀는 **배포·팀 구조 전면 개편**이 따릅니다.", r: "" }
        }
      },
      end: { type: "end" }
    },
    pm: {
      rc: "주문 생성 시 4개 외부 서비스를 동기 호출(FeignClient)하는 구조. delivery-service 지연이 전체로 전파되는 Cascading Failure.",
      qa: [
        { q: "MSA에서 장애 전파를 어떻게 방지?", a: "서킷 브레이커를 모든 외부 호출에 적용, 비핵심 로직은 Kafka로 비동기 전환." },
        { q: "장애 발생 시 첫 행동은?", a: "팀에 장애 선언, Incident Commander 지정, 원인 파악 전 시스템 변경 금지." }
      ],
      checklist: [
        "프로젝트에서 `FeignClient`를 grep해 **동기 호출 개수·대상 서비스명**을 목록으로 적어보세요.",
        "각 클라이언트에 **connect/read 타임아웃(ms)**이 문서화돼 있는지, 기본값 그대로인지 확인하세요.",
        "Resilience4j를 넣었다면 **서킷이 OPEN 될 조건(에러율·슬로우콜)**을 한 줄로 정의해 보세요.",
        "Zipkin에서 이번 시나리오처럼 **가장 긴 스팬이 어떤 Feign 호출인지** 찍어 스크린샷 수준으로 남겨보세요."
      ],
      pl: "물류 프로젝트에서 FeignClient로 배송을 동기 호출했다면 동일한 구조. 서킷 브레이커 추가가 포트폴리오 어필 포인트.",
      nextRec: [
        { id: "sc9", reason: "이 장애의 근본 원인인 '분산 트랜잭션'을 더 깊이 파헤쳐보세요" },
        { id: "sc4", reason: "서비스 간 장애 전파를 막는 또 다른 인프라 전략을 경험해보세요" }
      ],
      interviewQs: [
        "MSA 환경에서 하나의 서비스 장애가 전체로 전파되는 것을 어떻게 막을 수 있나요?",
        "서킷 브레이커 패턴의 3가지 상태(Closed, Open, Half-Open)와 각각의 동작을 설명해주세요.",
        "장애 상황에서 긴급 완화(Mitigation)와 근본 해결(Fix)을 분리해야 하는 이유는 무엇인가요?"
      ],
      codeChallenge: {
        title: "Resilience4j 서킷 브레이커 + Fallback 구현",
        prompt: "주문 서비스에서 배송 서비스를 호출할 때 서킷 브레이커와 fallback을 구현하세요. 배송 서비스가 장애 시 주문은 성공하되 배송은 나중에 처리되도록 해야 합니다.",
        starterCode: "@Service\npublic class OrderService {\n\n    private final DeliveryClient deliveryClient;\n\n    public OrderResponse createOrder(OrderRequest req) {\n        // TODO: 서킷 브레이커 + fallback 구현\n        // 배송 서비스 장애 시에도 주문은 성공해야 합니다\n        deliveryClient.requestDelivery(req.getOrderId());\n        return new OrderResponse(req.getOrderId(), \"SUCCESS\");\n    }\n}",
        hint: "@CircuitBreaker 어노테이션의 name, fallbackMethod 속성을 활용하세요. fallback 메서드에서는 실패한 배송 요청을 어딘가에 저장해야 합니다."
      }
    }
  },
  {
    id: "sc2", role: "결제 서비스 담당 개발자", brief: "고객의 카드에서 같은 금액이 두 번 빠졌습니다. 47건의 이중 결제가 발생 중입니다.", why: "결제가 있는 모든 서비스에서 반드시 겪는 문제. 멱등성을 모르면 프로덕션에 투입될 수 없습니다.", title: "고객이 결제가 두 번 됐다고 합니다",
    company: "페이나우 — 일 결제 12만 건 결제 서비스",
    tags: ["멱등성", "결제", "데이터 정합성"], diff: "중급", dur: "12분", cat: "데이터 정합성", icon: "💳", clr: "#a855f7",
    nodes: {
      start: {
        time: "11:23", title: "CS 인입 — 이중 결제", phase: "investigate",
        nar: ["월요일 오전, 정산 직전. CS팀에서 **전화 돌려막기** 수준으로 긴급 연락이 옵니다.", "같은 주문에 **두 번 승인**됐다는 클레임이 모바일·PC·앱에서 동시에 터지고, 최근 1시간만 해도 **47건·약 680만 원**이 중복 청구 상태입니다."],
        clues: {
          prompt: "어떤 정보를 먼저 확인하시겠습니까?",
          options: [
            { id: "log", label: "📋 결제 API 로그", content: [
              { t: "11:15:03", lv: "info", m: "POST /api/payments orderId=ORD-4821 -> 200 OK" },
              { t: "11:15:04", lv: "warn", m: "POST /api/payments orderId=ORD-4821 -> Gateway timeout 504 (client retried)" },
              { t: "11:15:05", lv: "info", m: "POST /api/payments orderId=ORD-4821 -> 200 OK (DUPLICATE!)" }
            ]},
            { id: "metric", label: "📊 결제 메트릭", metrics: [
              { l: "이중 결제", v: "47건", s: "danger", u: "최근 1시간" },
              { l: "영향 금액", v: "약 680만원", s: "danger", u: "중복 청구" },
              { l: "Gateway 504", v: "2.3%", s: "warning", u: "타임아웃 간헐" }
            ]},
            { id: "db", label: "🗃 DB 조회", content: [
              { t: "", lv: "info", m: "SELECT * FROM p_payments WHERE order_id='ORD-4821'" },
              { t: "", lv: "warn", m: "-> 2 rows returned! payment_id: PAY-001, PAY-002 (same amount, 2sec apart)" }
            ]}
          ]
        },
        timer: 45,
        freeFirst: "이중 결제가 발생한 원인이 무엇이라고 생각하시나요? 선택지를 보기 전에 본인의 추론을 적어보세요.",
        q: "이중 결제의 원인은 무엇이라고 추정하시나요?",
        hint: "클라이언트가 타임아웃으로 응답을 못 받았을 때 같은 요청을 다시 보내면?",
        ch: [
          { id: "A", text: "결제 API에 멱등성(Idempotency) 처리가 없다", desc: "같은 주문에 대한 결제 요청이 중복 실행되어도 막을 장치 없음", g: "best", nx: "s2fix",
            impact: { "신규 이중결제": "계속 발생", "원인": "정확히 파악" } },
          { id: "B", text: "프론트에서 결제 버튼 중복 클릭 가능", desc: "고객이 두 번 눌렀다", g: "ok", nx: "s2fix",
            impact: { "신규 이중결제": "일부만 방지", "원인": "부분 파악" } },
          { id: "C", text: "DB 트랜잭션 격리 수준 문제", desc: "더티 리드 발생", g: "bad", nx: "s2fix_bad",
            impact: { "신규 이중결제": "계속 발생", "원인": "잘못된 방향" } }
        ],
        fb: {
          A: { t: "🟢 정확한 진단!", b: "Gateway 타임아웃 시 클라이언트 재시도로 **같은 결제 2번 실행**. 서버에서 **멱등키** 기반 중복 감지가 없었습니다.", cost: "멱등 없이는 **504·재시도 한 번만으로도** 중복 캡처가 누적됩니다.", r: "Stripe, 토스페이먼츠 등 모든 결제 API는 멱등키를 필수로 요구합니다." },
          B: { t: "🟡 원인 중 하나지만 근본 아님", b: "프론트 방어는 필요하지만, **서버 측 방어 없이는 API 재시도로 여전히 이중 결제 발생**.", cost: "앱·외부 연동·PG 웹훅 지연까지 **서버가 못 막으면** 끝이 없습니다.", r: "" },
          C: { t: "🔴 관련 없음", b: "트랜잭션 격리 수준은 이 문제와 무관합니다.", cost: "격리 수준만 건드리면 **환불·정산 일정**만 밀릴 뿐, 중복 과금은 그대로입니다.", r: "" }
        },
        tradeoff: [
          { option: "멱등성 키(서버)", time: "2~3시간", risk: "낮음", dataLoss: "없음", note: "근본 해결" },
          { option: "프론트 버튼 비활성화", time: "30분", risk: "높음", dataLoss: "없음", note: "서버 재시도 못 막음" },
          { option: "격리 수준 변경", time: "1시간", risk: "높음", dataLoss: "가능", note: "잘못된 방향" }
        ]
      },
      s2fix_bad: {
        time: "11:35", title: "잘못된 방향 — 시간 낭비", phase: "action",
        nar: ["격리 수준만 건드렸더니 **이중 결제는 그대로**고, 15분은 그냥 증발했습니다.", "로그를 다시 보니 **같은 orderId로 결제 API가 2번** 찍히고, 중간에 **504 → 재시도** 패턴이 반복됩니다."],
        clues: {
          prompt: "멱등성 도입 전, 중복 패턴을 다시 확인합니다.",
          options: [
            { id: "log2", label: "📋 결제 로그 (동일 orderId)", content: [
              { t: "11:34", lv: "info", m: "POST /payments orderId=ORD-991 -> 200, idempotency-key: (empty)" },
              { t: "11:34", lv: "warn", m: "504 Gateway timeout -> client retry -> POST same body -> 200 (duplicate)" }
            ]},
            { id: "gw", label: "🌐 Gateway 설정", content: [
              { t: "", lv: "warn", m: "retry: idempotent methods only — POST는 기본 재시도 대상" },
              { t: "", lv: "error", m: "결제 POST에 **Idempotency-Key 헤더 검증 없음**" }
            ]},
            { id: "pg", label: "💳 PG 정책", metrics: [
              { l: "PG 멱등", v: "지원", s: "ok", u: "우리 쪽 키 전달 시" },
              { l: "현재 연동", v: "미전달", s: "danger", u: "orderId만 전송" }
            ]}
          ]
        },
        freeFirst: "이제 원인은 **멱등성 부재**로 좁혀졌습니다. 서버에서 막으려면 **어느 시점**(PG 호출 전/후)에 락·키를 두는 게 맞다고 보시나요?",
        slack: { name: "PG팀 김대리", time: "11:35", body: "취소 큐가 안 끊겨요. 원인 잡혔어요? 방금 집계 보니 이중 결제 **62건**까지 불었습니다. PG 쪽도 전화 와서 정리 좀 빨리 부탁드려요." },
        timer: 20,
        q: "올바른 원인을 파악했습니다. 이제 어떻게 막으시겠습니까?",
        ch: [
          { id: "A", text: "Redis SETNX로 orderId 기준 멱등성 구현", desc: "결제 시작 시 SET, 이미 존재하면 거부", g: "best", nx: "s2fix_bad_cleanup",
            impact: { "이중결제": "즉시 차단", "추가 손실": "15분간 추가 피해분" } },
          { id: "B", text: "프론트 결제 버튼 비활성화", desc: "클릭 중복 방지", g: "ok", nx: "s2fix_bad_cleanup",
            impact: { "이중결제": "일부만 차단", "추가 손실": "서버 재시도 못 막음" } }
        ],
        fb: {
          A: { t: "🟢 늦었지만 올바른 조치", b: "15분의 시간을 잃었지만, **근본 원인에 대한 정확한 조치**를 취했습니다.", cost: "이미 늘어난 **62건+α**는 별도 수습이 필요합니다.", r: "" },
          B: { t: "🟡 부분적 해결", b: "프론트 방어만으로는 **Gateway 재시도, 네트워크 재전송**을 막을 수 없습니다.", cost: "모바일·외부 클라이언트까지 커버하려면 **서버 멱등**이 필수입니다.", r: "" }
        },
        tradeoff: [
          { option: "Redis SETNX", time: "즉시", risk: "낮음", dataLoss: "없음", note: "근본 해결" },
          { option: "프론트만", time: "즉시", risk: "높음", dataLoss: "없음", note: "서버측 중복 못 막음" }
        ]
      },
      s2fix_bad_cleanup: {
        time: "11:50", title: "이미 발생한 62건 수습", phase: "action",
        nar: ["멱등성 처리를 적용하여 **신규 이중결제는 차단**되었습니다.", "하지만 이미 발생한 **62건의 이중결제(약 910만원)**를 처리해야 합니다. PG팀에서 일괄 환불 요청을 기다리고 있습니다."],
        clues: {
          prompt: "환불 전략 수립을 위한 정보를 확인합니다.",
          options: [
            { id: "sql", label: "🗃 중복 추출 쿼리", content: [
              { t: "", lv: "info", m: "SELECT order_id, COUNT(*) FROM p_payments WHERE status='CAPTURED' GROUP BY order_id HAVING COUNT(*)>1 -> 62 rows" },
              { t: "", lv: "warn", m: "환불 대상 금액 합계 자동 산출 가능" }
            ]},
            { id: "pgapi", label: "💳 PG 일괄 API", content: [
              { t: "", lv: "info", m: "POST /refunds/bulk — max 500건, idempotent request_id 지원" },
              { t: "", lv: "warn", m: "잘못된 idempotency 시 **전체 롤백** — 스테이징 검증 권장" }
            ]},
            { id: "comm", label: "📧 고객 안내", metrics: [
              { l: "이메일 템플릿", v: "준비됨", s: "ok", u: "자동 발송 가능" },
              { l: "법무 검토", v: "필요", s: "warning", u: "대량 환불 문구" }
            ]}
          ]
        },
        freeFirst: "62건 환불을 **빠르게** vs **안전하게** 중 무엇을 더 우선할까요? 그 이유를 적어보세요.",
        slack: { name: "PG팀 김대리", time: "11:48", body: "멱등 배포는 확인했어요. 이제 남은 **62건**인데, **한 건씩이면 3시간**은 기본이고 일괄 스크립트면 **30분**이래요. 저희도 찍힌 TID 맞춰야 해서, 방향만 빨리 정해주시면 바로 붙을게요." },
        met: [
          { l: "이중결제 건수", v: "62건", s: "danger", u: "환불 대기" },
          { l: "환불 금액", v: "~910만원", s: "danger", u: "고객 불만 누적 중" }
        ],
        timer: 20,
        q: "62건의 이중결제를 어떻게 환불 처리하시겠습니까?",
        ch: [
          { id: "A", text: "DB에서 중복 결제 추출 → PG 일괄 환불 API 스크립트", desc: "orderId 기준 중복 건 SELECT 후 PG 환불 API 호출", g: "best", nx: "end",
            impact: { "처리 시간": "30분", "정확도": "DB 기반 정확", "고객 안내": "환불 완료 후 자동 알림" } },
          { id: "B", text: "CS팀에 목록 전달하여 수동 처리", desc: "엑셀 추출 후 CS가 1건씩 환불", g: "ok", nx: "end",
            impact: { "처리 시간": "3시간", "정확도": "사람 실수 가능", "고객 안내": "지연" } }
        ],
        fb: {
          A: { t: "🟢 자동화된 수습!", b: "중복 결제를 **SQL로 정확히 추출**하고 PG API로 일괄 환불하면 빠르고 정확합니다. 이런 수습 스크립트를 빠르게 짤 수 있는 능력이 현업에서 높이 평가됩니다.", cost: "스크립트 버그 시 **대량 오환불** 리스크 — 드라이런·페어 필수입니다.", r: "현업에서는 장애 수습용 스크립트를 'remediation script'라고 부르며, 빠르게 작성하는 능력이 중요합니다." },
          B: { t: "🟡 느리지만 안전", b: "수동 처리는 시간이 오래 걸리고 고객 불만이 누적됩니다. 하지만 자동화 스크립트에 자신이 없다면 차선책입니다.", cost: "CS 인력·시간 비용이 크고 **실수·누락** 가능성이 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "일괄 스크립트", time: "30분", risk: "낮음", dataLoss: "없음", note: "빠르고 정확" },
          { option: "수동 처리", time: "3시간", risk: "실수 가능", dataLoss: "없음", note: "고객 불만 누적" }
        ]
      },
      s2fix: {
        time: "11:40", title: "긴급 조치 — 이중 결제 방지", phase: "action",
        nar: ["원인은 잡혔는데, **지금 이 순간에도** 504→재시도로 같은 패턴이 반복되고 있습니다. PG·CS 양쪽 전화가 동시에 올라오는 중입니다."],
        clues: {
          prompt: "즉시 적용 가능한 방어선을 비교합니다.",
          options: [
            { id: "redis", label: "📋 Redis 멱등 키", content: [
              { t: "", lv: "info", m: "SETNX payment:idem:{orderId} 1 EX 300 -> PG 호출 전 차단" },
              { t: "", lv: "warn", m: "Redis 장애 시 정책: fail-open vs fail-closed 결정 필요" }
            ]},
            { id: "dbu", label: "🗃 DB unique", content: [
              { t: "", lv: "warn", m: "UNIQUE(order_id, status=CAPTURED) — 이미 캡처된 주문 두 번째 삽입 시 DB 에러" },
              { t: "", lv: "error", m: "PG에는 이미 **두 번 과금**된 뒤일 수 있음" }
            ]},
            { id: "gw2", label: "🌐 Gateway 임시", content: [
              { t: "", lv: "warn", m: "POST /payments retry off — 부작용: 일시적 네트워크 오류 시 고객 실패 증가" }
            ]}
          ]
        },
        freeFirst: "**PG 호출 전**에 막는 것과 **DB 제약**으로 막는 것, 지금 상황에서 무엇이 더 나은 타협인가요? 한두 문장으로 적어보세요.",
        slack: { name: "CS팀 이수진", time: "11:38", body: "지금 항의 전화가 **큐에서 안 줄어요**. 인스타에도 '두 번 결제됐다' 스샷 올라오기 시작했어요. **막는 거부터** 부탁드릴게요, 미안해요 말만 하기엔 너무 커졌어요." },
        timer: 30,
        q: "이중 결제를 즉시 막기 위한 조치는?",
        hint: "멱등성 키는 어디에 저장하고, 어떤 단위로 중복을 판단해야 할까요?",
        ch: [
          { id: "A", text: "Redis SETNX로 orderId 기준 멱등성 구현", desc: "결제 시작 시 SET, 이미 존재하면 거부. TTL 5분.", g: "best", nx: "end",
            impact: { "이중결제": "즉시 차단", "성능 영향": "Redis O(1)", "복잡도": "낮음" } },
          { id: "B", text: "DB에 unique constraint 추가", desc: "같은 주문의 결제 완료 2개 방지", g: "ok", nx: "end",
            impact: { "이중결제": "PG 호출 후 차단", "성능 영향": "DB 부하", "복잡도": "낮음" } },
          { id: "C", text: "Gateway 타임아웃을 30초로 늘림", desc: "타임아웃이 안 나게", g: "bad", nx: "end",
            impact: { "이중결제": "빈도 감소 (제거 안됨)", "성능 영향": "응답 지연", "복잡도": "낮음" } }
        ],
        fb: {
          A: { t: "🟢 최적의 방어!", b: "**Redis SETNX + TTL**: 결제 시작 시 플래그 SET, 이미 존재하면 즉시 거부.", cost: "Redis SPOF·네트워크 분리 시 **운영 정책**(fail-open/closed) 문서화가 필요합니다.", r: "토스페이먼츠, Stripe 등 모두 멱등키 기반 중복 방지를 구현합니다." },
          B: { t: "🟡 최후의 보루", b: "unique constraint는 마지막 방어선으로 좋지만, **이미 PG사에 결제 2번 나간 후**에야 막을 수 있습니다.", cost: "환불·CS 비용이 이미 발생한 뒤입니다.", r: "" },
          C: { t: "🔴 문제를 숨기는 것뿐", b: "30초 넘는 지연 시 같은 문제 반복. 근본적으로 **재시도해도 안전한 구조**를 만들어야.", cost: "타임아웃만 늘리면 **사용자 체감 대기**와 **스레드 점유**가 악화됩니다.", r: "" }
        },
        tradeoff: [
          { option: "Redis SETNX", time: "즉시 차단", risk: "낮음", dataLoss: "없음", note: "PG 호출 전 차단" },
          { option: "DB unique", time: "PG 호출 후", risk: "중간", dataLoss: "PG에 이미 과금", note: "최후 방어선" },
          { option: "타임아웃 증가", time: "미해결", risk: "높음", dataLoss: "없음", note: "근본 해결 아님" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "결제 API에 멱등성 처리 없어 Gateway 타임아웃 후 클라이언트 재시도 시 동일 결제 중복 실행.",
      qa: [
        { q: "API 멱등성이란?", a: "같은 요청을 여러 번 보내도 결과 동일. 네트워크 불안정으로 중복은 필연적이므로 결제/주문에 필수." },
        { q: "분산 환경에서 멱등성 구현?", a: "Redis SETNX+TTL로 분산 락. DB unique constraint를 최후 방어선으로." }
      ],
      checklist: [
        "주문/결제 API에서 **같은 orderId로 POST가 두 번** 오면 DB에 행이 몇 개 쌓이는지 시나리오를 적어보세요.",
        "Redis `SETNX payment:idem:{orderId}` 패턴으로 **TTL 5분** 멱등을 설계해 보고, 실패 시 **fail-open vs fail-closed**를 한 줄로 정하세요.",
        "Gateway·Feign·클라이언트 중 **어디서 재시도가 나는지** 설정 파일에서 찾아 체크리스트로 남기세요.",
        "`p_payments`에 **(order_id, 상태) 유니크**가 있으면 중복 캡처를 어디서 막는지 설명할 수 있나요?"
      ],
      pl: "물류 프로젝트 주문 API가 재시도되면 중복 주문 가능. 멱등키 도입으로 데이터 정합성 보장 경험 어필.",
      nextRec: [
        { id: "sc3", reason: "재고 관리에서도 데이터 정합성 문제가 발생합니다" },
        { id: "sc9", reason: "MSA에서 서비스 간 정합성을 보장하는 SAGA 패턴을 경험해보세요" }
      ],
      interviewQs: [
        "API 멱등성이란 무엇이고, 왜 결제 시스템에서 필수적인가요?",
        "분산 환경에서 Redis SETNX를 이용한 멱등성 구현 방법과 주의할 점을 설명해주세요.",
        "클라이언트 재시도(retry)가 발생하는 상황과 서버 측에서 이를 안전하게 처리하는 방법은?"
      ],
      codeChallenge: {
        title: "Redis SETNX 기반 결제 멱등성 구현",
        prompt: "결제 API에서 동일한 orderId로 중복 요청이 와도 한 번만 처리되도록 Redis 기반 멱등성 체크 로직을 구현하세요.",
        starterCode: "@Service\npublic class PaymentService {\n\n    private final RedisTemplate<String, String> redis;\n    private final PgClient pgClient;\n\n    public PaymentResult processPayment(String orderId, int amount) {\n        // TODO: Redis SETNX로 멱등성 체크\n        // 이미 처리된 결제면 기존 결과 반환\n        // 새 결제면 PG 호출 후 결과 저장\n        return pgClient.charge(orderId, amount);\n    }\n}",
        hint: "SETNX의 TTL 설정, 결제 실패 시 키 삭제 여부, fail-open vs fail-closed 정책을 고려하세요."
      }
    }
  },
  {
    id: "sc3", role: "커머스 백엔드 개발자", brief: "한정판 콜라보 굿즈(아이돌 × 브랜드) 100세트를 팔았는데 주문이 203건 들어왔습니다. 103명에게 취소 연락을 해야 합니다.", why: "동시성 제어는 이커머스 면접의 단골 주제입니다. '재고가 마이너스가 되면 어떻게 하나요?'라는 질문에 실전 답을 할 수 있어야 합니다.", title: "한정판 100개인데 200개가 팔렸다",
    company: "딜카트 — 일 100만 PV 한정판 딜 플랫폼",
    tags: ["동시성", "Race Condition", "재고 관리"], diff: "상급", dur: "12분", cat: "동시성 문제", icon: "🏷️", clr: "#22c55e",
    nodes: {
      start: {
        time: "12:00", title: "한정판 딜 — 초과 판매", phase: "investigate",
        nar: ["정오 12시. **아이돌 콜라보 한정 굿즈 100세트** 드롭 오픈. 팬커뮤니티 링크까지 퍼지며 **3만 명 동시 접속**.", "1분 만에 품절 배너가 떴는데, 결제 완료 기준 주문이 **203건**. 팬덤 채팅방에 **'샀는데 취소?'** 글이 벌써 올라옵니다."],
        clues: {
          prompt: "초과 판매 원인을 찾기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "log", label: "📋 주문 로그 (동시 요청)", content: [
              { t: "12:00:00.001", lv: "info", m: "Thread-1: SELECT stock FROM p_products WHERE id='SNK-001' -> stock=1" },
              { t: "12:00:00.001", lv: "info", m: "Thread-2: SELECT stock FROM p_products WHERE id='SNK-001' -> stock=1" },
              { t: "12:00:00.002", lv: "info", m: "Thread-1: UPDATE stock=stock-1 -> stock=0" },
              { t: "12:00:00.002", lv: "info", m: "Thread-2: UPDATE stock=stock-1 -> stock=-1 (!)" }
            ]},
            { id: "metric", label: "📊 주문/재고 메트릭", metrics: [
              { l: "실제 재고", v: "100개", s: "ok", u: "원래 수량" },
              { l: "생성 주문", v: "203건", s: "danger", u: "103건 초과!" },
              { l: "동시 접속", v: "30,000", s: "warning", u: "초당 5,000 요청" }
            ]},
            { id: "code", label: "💻 재고 차감 코드", content: [
              { t: "", lv: "info", m: "// OrderService.java" },
              { t: "", lv: "warn", m: "int stock = productRepo.findById(id).getStock();  // SELECT" },
              { t: "", lv: "warn", m: "if (stock > 0) {                                   // CHECK" },
              { t: "", lv: "warn", m: "  product.setStock(stock - 1);                     // UPDATE" },
              { t: "", lv: "warn", m: "  productRepo.save(product);                       // SAVE" },
              { t: "", lv: "error", m: "} // <-- NOT ATOMIC! Race Condition!" }
            ]}
          ]
        },
        timer: 45,
        freeFirst: "로그와 코드를 보고, 왜 100개 재고에서 203건이 팔릴 수 있었는지 본인의 분석을 적어보세요.",
        q: "초과 판매의 근본 원인은?",
        hint: "Thread-1과 Thread-2가 같은 시간에 같은 재고를 읽고 있습니다.",
        ch: [
          { id: "A", text: "Race Condition — 재고 조회와 차감이 원자적이지 않다", desc: "여러 스레드가 동시에 같은 재고를 읽고 각각 차감", g: "best", nx: "s3fix",
            impact: { "초과판매": "원인 정확 파악", "다음 딜": "해결 가능" } },
          { id: "B", text: "트래픽이 너무 많아서", desc: "서버 늘리면 해결", g: "bad", nx: "s3fix_bad",
            impact: { "초과판매": "더 악화", "다음 딜": "같은 문제" } },
          { id: "C", text: "DB 격리 수준이 낮아서", desc: "SERIALIZABLE로 올리면 해결", g: "ok", nx: "s3fix",
            impact: { "초과판매": "해결 가능", "다음 딜": "성능 극저하" } }
        ],
        fb: {
          A: { t: "🟢 정확!", b: "전형적 **Race Condition**. SELECT, CHECK, UPDATE가 원자적이지 않아 여러 스레드가 같은 재고를 읽고 각각 차감합니다.", r: "쿠팡, 11번가 등 모든 이커머스가 이 문제를 겪었습니다." },
          B: { t: "🔴 오히려 악화", b: "서버를 늘리면 **동시에 재고를 읽는 스레드가 더 많아져** 초과 판매가 악화됩니다.", r: "" },
          C: { t: "🟡 비용 큼", b: "SERIALIZABLE은 모든 트랜잭션을 직렬화하므로 초당 5,000 요청에서 **성능이 극도로 저하**.", r: "" }
        },
        tradeoff: [
          { option: "Race Condition 파악", time: "-", risk: "-", dataLoss: "-", note: "정확한 진단이 해결의 시작" },
          { option: "서버 확장", time: "10분", risk: "높음", dataLoss: "더 큰 초과판매", note: "동시성 문제 악화" },
          { option: "SERIALIZABLE", time: "5분", risk: "중간", dataLoss: "없음", note: "성능 90% 저하" }
        ]
      },
      s3fix_bad: {
        time: "12:30", title: "서버 확장 — 상황 악화", phase: "action",
        nar: ["서버를 3배로 늘렸더니 **같은 굿즈 행을 읽는 경쟁만 세 배**로 늘어, 초과 판매가 **312건**까지 불었습니다."],
        clues: {
          prompt: "스케일아웃이 왜 재고 레이스를 악화시키는지 단서를 확인합니다.",
          options: [
            { id: "pool", label: "📋 커넥션·스레드", content: [
              { t: "12:30", lv: "warn", m: "인스턴스 9대 — 동시에 같은 행 SELECT 후 UPDATE 경쟁 **9배**" },
              { t: "12:30", lv: "info", m: "DB row lock 없음 — 애플리케이션만으로 순서 보장 실패" }
            ]},
            { id: "metric2", label: "📊 재고 음수", metrics: [
              { l: "p_products.stock", v: "-212", s: "danger", u: "물리 재고와 불일치" },
              { l: "주문 건수", v: "312 초과", s: "danger", u: "취소 대상 증가" }
            ]},
            { id: "k8s", label: "☸ 인프라", content: [
              { t: "", lv: "info", m: "HPA: CPU 기준 스케일아웃 — 트래픽은 줄었는데 **동시성 경쟁은 동일 패턴**" }
            ]}
          ]
        },
        freeFirst: "서버를 늘리면 왜 **동시성 버그**가 나아지지 않고 나빠질 수 있나요? 한두 문장으로 적어보세요.",
        slack: { name: "운영팀 박과장", time: "12:30", body: "초과가 **312건**까지 불었어요. 스케일만 올렸더니 더 심해진 것 같은데… 이거 **재고 차감 로직** 아닌가요? MD가 전화 와서 설명 좀 해달래요." },
        timer: 20,
        q: "서버 확장이 오히려 악화시켰습니다. 진짜 원인은?",
        ch: [
          { id: "A", text: "Race Condition — DB 원자적 UPDATE로 해결", desc: "UPDATE SET stock=stock-1 WHERE stock > 0", g: "best", nx: "s3fix_bad_cleanup",
            impact: { "초과판매": "즉시 방지", "복구": "312건 취소 필요" } },
          { id: "B", text: "비관적 락 적용", desc: "SELECT FOR UPDATE", g: "ok", nx: "s3fix_bad_cleanup",
            impact: { "초과판매": "방지", "성능": "락 경합 발생" } }
        ],
        fb: {
          A: { t: "🟢 이제야 올바른 진단!", b: "서버를 늘려도 **Race Condition은 악화만 됩니다.** 원자적 UPDATE가 가장 단순하고 효과적.", cost: "배포 후에도 **이미 깨진 재고·주문 데이터** 정리가 별도로 필요합니다.", r: "" },
          B: { t: "🟡 동작하지만 성능 이슈", b: "초당 5,000 요청에서 **락 경합이 심해** 성능 저하.", cost: "락 대기로 **타임아웃·데드락** 가능성 — 모니터링이 필요합니다.", r: "" }
        },
        tradeoff: [
          { option: "원자적 UPDATE", time: "즉시", risk: "없음", dataLoss: "없음", note: "가장 효과적" },
          { option: "비관적 락", time: "즉시", risk: "성능 저하", dataLoss: "없음", note: "경합 발생" }
        ]
      },
      s3fix_bad_cleanup: {
        time: "12:45", title: "312명의 고객 — 취소 대응", phase: "action",
        nar: ["재고 로직은 수정했지만, **312건의 초과 판매**는 그대로 남았습니다. 콜라보 굿즈라 **리셀 시세**까지 언급되는 글이 섞이기 시작했습니다.", "고객은 이미 **결제 완료·배송 준비 중** 메일을 받은 사람도 있어, 감정이 더 거칩니다."],
        clues: {
          prompt: "보상 수준을 정하기 위한 내부·외부 정보를 확인합니다.",
          options: [
            { id: "finance", label: "💰 재무 / 한도", metrics: [
              { l: "보상 예산 상한", v: "5천만원", s: "warning", u: "당일 승인 가능" },
              { l: "쿠폰 중복 사용", v: "리스크", s: "danger", u: "약관 검토 필요" }
            ]},
            { id: "legal2", label: "📋 공정거래·약관", content: [
              { t: "", lv: "info", m: "오판매 시 **전액 환불 + 일정 보상** 사례 다수" },
              { t: "", lv: "warn", m: "환불만 시 **집단민원** 가능성 — 문구 검수" }
            ]},
            { id: "vip", label: "👥 고객 세그먼트", content: [
              { t: "", lv: "info", m: "312명 중 VIP 18명 — 우선 연락 시 SNS 완화 효과" }
            ]}
          ]
        },
        freeFirst: "초과 판매로 취소되는 312명의 고객에게 보낼 **사과 안내 메시지**를 작성해보세요. '구매 성공했는데 왜 취소?'라는 분노를 고려해야 합니다. 환불 + 보상 + 재구매 안내를 포함하세요.",
        slack: { name: "CS팀 이팀장", time: "12:40", body: "312명 분량인데 전화가 끊기질 않아요. **'팬싸 당첨됐다고 했는데 취소?'** 이런 말부터 나와요. 보상 틀만이라도 먼저 잡아주세요, 안 그럼 녹음본 돌아다녀요." },
        met: [
          { l: "취소 대상", v: "312건", s: "danger", u: "서버 확장 후 추가분 포함" },
          { l: "SNS 멘션", v: "47건", s: "warning", u: "부정적 여론 확산 중" }
        ],
        timer: 25,
        q: "312명의 초과 판매 고객에게 어떻게 대응하시겠습니까?",
        ch: [
          { id: "A", text: "즉시 전액 환불 + 보상 쿠폰 + 다음 딜 우선 구매권", desc: "빠른 환불과 차별화된 보상으로 고객 이탈 방지", g: "best", nx: "end",
            impact: { "고객 이탈": "최소화", "비용": "쿠폰 + 우선권", "브랜드": "신뢰 회복" } },
          { id: "B", text: "환불만 진행, 별도 보상 없음", desc: "원래 없는 재고였으므로 환불로 충분", g: "bad", nx: "end",
            impact: { "고객 이탈": "높음", "비용": "없음", "브랜드": "추가 하락" } }
        ],
        fb: {
          A: { t: "🟢 비즈니스 감각!", b: "기술적 실수의 비용은 **보상 쿠폰이 아니라 고객 이탈**입니다. 빠르고 넉넉한 보상은 오히려 충성 고객을 만들 수 있습니다.", cost: "쿠폰·우선권 비용은 **당기 마케팅 예산**에서 처리해야 할 수 있습니다.", r: "아마존은 자사 실수로 인한 주문 취소 시 10~20% 추가 할인을 제공하는 정책을 운영합니다." },
          B: { t: "🔴 고객 관점 부재", b: "기술적으로는 맞지만, **고객은 '구매 성공'을 경험한 후 취소 통보**를 받은 것입니다. 보상 없는 취소는 SNS 확산과 브랜드 피해로 이어집니다.", cost: "단기 비용은 줄어도 **NPS·재구매율** 하락이 장기 매출에 더 큽니다.", r: "" }
        },
        tradeoff: [
          { option: "환불+보상+우선권", time: "1시간", risk: "낮음", dataLoss: "없음", note: "충성 고객 전환" },
          { option: "환불만", time: "30분", risk: "높음", dataLoss: "없음", note: "고객 이탈+SNS 피해" }
        ]
      },
      s3fix: {
        time: "13:00", title: "재고 차감 개선", phase: "action",
        nar: ["103명에게 **굿즈 한정판** 주문 취소와 보상 쿠폰을 발송했습니다. 이제 재고 차감 로직을 개선합니다."],
        clues: {
          prompt: "동시성 제어 수단을 비교하기 위한 단서입니다.",
          options: [
            { id: "atomic", label: "📋 원자적 UPDATE", content: [
              { t: "", lv: "info", m: "UPDATE p_products SET stock=stock-1 WHERE id=? AND stock>0" },
              { t: "", lv: "warn", m: "rowsAffected==0 → 품절 처리 — **DB 한 번의 진실**" }
            ]},
            { id: "redlock", label: "🔒 Redis 락", content: [
              { t: "", lv: "warn", m: "Redisson tryLock — 락 TTL·연장 실패 시 이슈" },
              { t: "", lv: "info", m: "다중 인스턴스에서도 동일 상품 키로 직렬화 가능" }
            ]},
            { id: "pessimistic", label: "🗃 SELECT FOR UPDATE", content: [
              { t: "", lv: "warn", m: "트랜잭션 길이만큼 행 락 — 데드락·대기열 주의" }
            ]}
          ]
        },
        freeFirst: "초당 5,000요청·다음 주 딜까지 고려할 때, **운영 복잡도 vs 정확도** 사이에서 무엇을 우선하시겠어요?",
        slack: { name: "MD팀 최리더", time: "12:50", body: "다음 주에도 **콜라보 드롭** 잡혀 있어요. 이번처럼 **초과 판매 →취소** 한 번 더 나오면 브랜드 쪽 계약부터 꼬여요. 이번에 끝내주세요." },
        timer: 30,
        q: "어떤 방식으로 동시성을 제어하시겠습니까?",
        hint: "DB 원자적 연산, 비관적 락, 분산 락의 장단점을 비교해보세요.",
        ch: [
          { id: "A", text: "UPDATE SET stock=stock-1 WHERE id=? AND stock > 0", desc: "조회+차감을 하나의 SQL로. 영향 row 0이면 품절.", g: "best", nx: "end",
            impact: { "초과판매": "완벽 방지", "성능": "변화 없음", "복잡도": "매우 낮음" } },
          { id: "B", text: "Redis 분산 락(Redisson)", desc: "SETNX로 락 획득 후 차감", g: "ok", nx: "end",
            impact: { "초과판매": "방지", "성능": "락 대기 발생", "복잡도": "높음" } },
          { id: "C", text: "비관적 락 (SELECT FOR UPDATE)", desc: "DB 행 레벨 락으로 동시 접근 차단", g: "ok", nx: "end",
            impact: { "초과판매": "방지", "성능": "락 경합 심함", "복잡도": "중간" } }
        ],
        fb: {
          A: { t: "🟢 가장 단순하고 효과적!", b: "DB 엔진이 원자성을 보장합니다. 별도 락 없이 초과 판매를 완벽 방지. **단순한 해결책이 최고의 해결책**.", cost: "인덱스·격리 수준에 따라 **유령 재고** 드물게 발생할 수 있어 모니터링이 필요합니다.", r: "많은 이커머스가 이 방식을 기본으로 사용합니다." },
          B: { t: "🟡 복잡", b: "분산 락은 **락 대기, 타임아웃, 데드락** 등 관리 포인트가 많습니다. DB 원자 연산이 가능하면 불필요한 복잡성.", cost: "Redis 장애 시 **fail-open 여부**가 정책으로 정해져야 합니다.", r: "" },
          C: { t: "🟡 성능 이슈", b: "초당 5,000 요청에서 **락 경합이 심해** 성능이 크게 저하됩니다.", cost: "인기 상품 한 줄에 몰리면 **핫스팟**이 됩니다.", r: "" }
        },
        tradeoff: [
          { option: "원자적 UPDATE", time: "즉시", risk: "없음", dataLoss: "없음", note: "가장 단순하고 효과적" },
          { option: "Redis 분산 락", time: "락 대기", risk: "데드락 가능", dataLoss: "없음", note: "극한 트래픽에 적합" },
          { option: "SELECT FOR UPDATE", time: "락 대기", risk: "경합 심함", dataLoss: "없음", note: "단일 DB에서 유효" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "재고 SELECT, CHECK, UPDATE가 원자적이지 않아 Race Condition 발생.",
      qa: [
        { q: "Race Condition이란?", a: "여러 스레드가 공유 자원에 동시 접근 시 실행 순서에 따라 결과가 달라지는 문제." },
        { q: "가장 효과적인 재고 차감법?", a: "UPDATE SET stock=stock-1 WHERE id=? AND stock > 0. DB 엔진이 원자성 보장." }
      ],
      checklist: [
        "재고 차감 코드에서 **SELECT → if(stock>0) → UPDATE** 패턴이 있는지 찾아, 해당 메서드명을 적어보세요.",
        "`UPDATE p_products SET stock = stock - :qty WHERE id = :id AND stock >= :qty`로 바꾼 뒤 **affected rows == 0**이면 품절로 처리하는 흐름을 코드로 써보세요.",
        "같은 상품에 대해 **동시에 50개 요청**이 온다고 가정하고, DB 락 없이 무슨 일이 생기는지 말로 설명해 보세요.",
        "k6·JMeter로 **동시 100건** 주문을 날려 보고, 재고 음수·초과 판매가 재현되는지 확인하세요."
      ],
      pl: "물류 프로젝트에서 주문 시 재고 차감에 원자적 UPDATE를 적용하면 동시성 제어 경험 어필.",
      nextRec: [{id:"sc8",reason:"정산 정합성 문제를 경험해보세요 — 이커머스에서 돈 계산이 틀리면 사업이 멈춥니다"},{id:"sc2",reason:"결제에서도 동시 요청 문제가 발생합니다"}],
      interviewQs: [
        "동시성 문제(Race Condition)란 무엇이고, 이커머스 재고 관리에서 어떻게 발생하나요?",
        "비관적 락, 낙관적 락, 원자적 UPDATE의 차이점과 각각의 적합한 상황을 설명해주세요.",
        "초과 판매가 발생했을 때 기술적 조치와 비즈니스 대응을 각각 어떻게 하시겠습니까?"
      ],
      codeChallenge: {
        title: "원자적 UPDATE로 재고 동시성 제어",
        prompt: "동시에 수천 명이 같은 상품을 주문할 때 초과 판매가 발생하지 않도록 재고 차감 로직을 구현하세요. 기존의 SELECT → CHECK → UPDATE 패턴을 원자적으로 바꿔야 합니다.",
        starterCode: "@Service\npublic class OrderService {\n\n    private final ProductRepository productRepo;\n\n    @Transactional\n    public OrderResult placeOrder(Long productId, int qty) {\n        // 기존 코드 (Race Condition 발생)\n        Product p = productRepo.findById(productId).orElseThrow();\n        if (p.getStock() >= qty) {\n            p.setStock(p.getStock() - qty);\n            productRepo.save(p);\n            return OrderResult.success();\n        }\n        return OrderResult.soldOut();\n    }\n}",
        hint: "UPDATE 쿼리 하나로 조회+검증+차감을 원자적으로 처리하고, affected rows == 0이면 품절로 처리하세요."
      }
    }
  },
  {
    id: "sc4", role: "인프라/백엔드 개발자", brief: "Redis가 OOM으로 죽었고, 2,000만 PV의 캐시가 전부 사라졌습니다. DB가 95% CPU로 비명을 지르고 있습니다.", why: "Redis를 사용하는 이커머스에서 가장 무서운 장애입니다. '캐시가 날아가면 어떻게 되나요?'는 인프라 면접 필수 질문입니다.", title: "Redis가 죽자 DB가 따라 죽었다",
    company: "스타일픽 — 일 PV 2,000만 패션 커머스",
    tags: ["캐시 스탬피드", "Redis", "Thundering Herd"], diff: "중급", dur: "10분", cat: "인프라 장애", icon: "⚡", clr: "#f97316",
    nodes: {
      start: {
        time: "10:05", title: "Redis OOM 크래시", phase: "investigate",
        nar: ["Redis 마스터가 **OOM으로 크래시**. 페일오버 후 **전체 캐시 초기화**.", "상품 API 응답 **50ms에서 3,200ms**로 급증. DB CPU 95%."],
        clues: {
          prompt: "상황을 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "redis", label: "📋 Redis 로그", content: [
              { t: "10:05:01", lv: "error", m: "Redis MASTER node OOM killed, failover initiated" },
              { t: "10:05:03", lv: "warn", m: "Redis SLAVE promoted to MASTER, all keys flushed" }
            ]},
            { id: "metric", label: "📊 시스템 메트릭", metrics: [
              { l: "캐시 히트율", v: "0%", s: "danger", u: "전체 초기화" },
              { l: "DB CPU", v: "95%", s: "danger", u: "과부하" },
              { l: "동시 DB 쿼리", v: "8,400", s: "danger", u: "평소 대비 60x" }
            ]},
            { id: "app", label: "📋 앱 로그", content: [
              { t: "10:05:04", lv: "error", m: "Cache MISS 100% - all requests hitting DB directly" },
              { t: "10:05:05", lv: "error", m: "PostgreSQL: too many connections (max 200, current 200)" }
            ]}
          ]
        },
        timer: 40,
        freeFirst: "캐시가 전부 사라진 상황에서 왜 DB가 죽는지, 그리고 어떻게 대응해야 하는지 본인의 생각을 적어보세요.",
        q: "이 현상의 이름과 대응 방법은?",
        hint: "캐시가 한꺼번에 사라지면 모든 요청이 동시에 DB로 몰립니다.",
        ch: [
          { id: "A", text: "Cache Stampede - Rate Limiting + 점진적 워밍업", desc: "DB 보호하면서 캐시 순차 재구축", g: "best", nx: "s4w",
            impact: { "DB CPU": "점진적 회복", "서비스": "부분 복구", "시간": "10~15분" } },
          { id: "B", text: "DB 스케일업", desc: "DB가 감당할 수 있게", g: "ok", nx: "s4w",
            impact: { "DB CPU": "일시적 완화", "서비스": "느림", "시간": "20~30분" } },
          { id: "C", text: "캐시 없이 DB로 직접 처리", desc: "Redis 의존성 제거", g: "bad", nx: "s4_bad",
            impact: { "DB CPU": "100% (죽음)", "서비스": "완전 중단", "시간": "-" } }
        ],
        fb: {
          A: { t: "🟢 정확!", b: "**Cache Stampede(Thundering Herd)**: 캐시 소실 시 동시에 DB로 몰리는 현상. **Mutex Lock 패턴**으로 하나만 DB 조회, 나머지는 대기.", cost: "스탬피드가 이어지는 동안 **상품·결제 플로우 전반이 지연**되고 장바구니·재고와 연쇄로 터질 수 있습니다.", r: "Instagram, Twitter 등은 캐시 워밍업 전용 배치를 운영합니다." },
          B: { t: "🟡 임시방편", b: "스케일업은 시간이 걸리고, 캐시 없이 DB만으로 운영하는 건 비현실적.", cost: "인스턴스 교체·스펙업이 끝날 때까지 **장애 창이 길어지고** 월 인프라 비용이 불필요하게 커집니다.", r: "" },
          C: { t: "🔴 서비스 마비", b: "Redis가 있는 이유 = **DB만으로 현재 트래픽 감당 불가**.", cost: "복구 전까지 **주문·조회가 사실상 중단**되어 매출·CS·SLA에 동시에 타격입니다.", r: "" }
        },
        tradeoff: [
          { option: "Rate Limit + 워밍업", time: "10~15분", risk: "낮음", dataLoss: "없음", note: "현업 표준" },
          { option: "DB 스케일업", time: "20~30분", risk: "중간", dataLoss: "없음", note: "비용 높음" },
          { option: "캐시 제거", time: "불가", risk: "최대", dataLoss: "없음", note: "DB 즉사" }
        ]
      },
      s4_bad: {
        time: "10:12", title: "DB 완전 마비 — 서비스 중단", phase: "action",
        nar: ["Redis를 제거하고 DB로 직접 처리하자 **초당 8,400개의 쿼리**가 DB에 쏟아졌습니다.", "PostgreSQL이 **max_connections 초과**로 새 연결을 거부합니다. **서비스 완전 중단.**"],
        clues: {
          prompt: "DB가 죽은 원인과 복구 방법을 확인합니다.",
          options: [
            { id: "dblog", label: "📋 DB 에러 로그", content: [
              { t: "10:12", lv: "error", m: "FATAL: too many connections for role 'app_user' (max 200)" },
              { t: "10:12", lv: "error", m: "pgbouncer: server connection count exceeded" }
            ]},
            { id: "load", label: "📊 부하 비교", metrics: [
              { l: "캐시 있을 때", v: "120 QPS", s: "ok", u: "DB로" },
              { l: "캐시 없을 때", v: "8,400 QPS", s: "danger", u: "DB로 (70배)" },
              { l: "현재 상태", v: "중단", s: "danger", u: "연결 거부" }
            ]},
            { id: "option", label: "🛠 복구 수단", content: [
              { t: "", lv: "info", m: "Redis 새 마스터 정상 가동 중 — 캐시 재도입 가능" },
              { t: "", lv: "warn", m: "DB 재시작 시 진행 중인 쿼리 전부 중단" }
            ]}
          ]
        },
        freeFirst: "Redis를 빼면 왜 DB가 죽었나요? 평소 Redis가 **얼마나 많은 부하를 흡수**하고 있었는지 한두 문장으로 적어보세요.",
        slack: { name: "DBA 한시니어", time: "10:11", body: "#incident-2024-redis `[FATAL]` primary 연결 거부 중입니다. pgbouncer 대기열도 꽉 찼어요. **캐시부터 다시 붙이지 않으면** 스케일업 전에 트랜잭션 큐가 먼저 녹습니다. 롤백/워밍업 쪽으로 움직여주세요." },
        met: [
          { l: "서비스 상태", v: "완전 중단", s: "danger", u: "DB 연결 거부" },
          { l: "추가 손실", v: "7분", s: "danger", u: "잘못된 판단으로 지연" }
        ],
        timer: 20,
        q: "DB가 죽었습니다. 어떻게 복구하시겠습니까?",
        ch: [
          { id: "A", text: "Redis 캐시 재도입 + Rate Limiting + 점진적 워밍업", desc: "캐시를 다시 살리고 DB 보호", g: "best", nx: "s4w",
            impact: { "서비스": "점진적 복구", "DB": "보호됨", "시간": "10~15분" } },
          { id: "B", text: "DB 스케일업으로 트래픽 감당", desc: "더 큰 DB 인스턴스로 교체", g: "ok", nx: "s4w",
            impact: { "서비스": "느린 복구", "DB": "임시 완화", "시간": "20~30분" } }
        ],
        fb: {
          A: { t: "🟢 늦었지만 올바른 판단", b: "Redis가 **트래픽의 98%를 흡수**하고 있었습니다. 캐시 없이 DB만으로는 불가능합니다.", cost: "중단 동안 유실된 **요청·세션 데이터** 복구가 별도로 필요합니다.", r: "" },
          B: { t: "🟡 비용 높고 근본 해결 아님", b: "8,400 QPS를 DB만으로 처리하려면 **엔터프라이즈급 인스턴스**가 필요합니다.", cost: "DB 비용이 **월 수천만 원** 단위로 증가합니다.", r: "" }
        },
        tradeoff: [
          { option: "캐시 재도입", time: "10~15분", risk: "낮음", dataLoss: "없음", note: "근본 해결" },
          { option: "DB 스케일업", time: "20~30분", risk: "중간", dataLoss: "없음", note: "비용 폭증" }
        ]
      },
      s4w: {
        time: "10:15", title: "캐시 워밍업 전략", phase: "action",
        nar: ["Rate Limiting으로 DB 보호 중. 캐시를 다시 채워야 합니다."],
        clues: {
          prompt: "워밍업 전략을 정하기 위한 부하·키 패턴을 확인합니다.",
          options: [
            { id: "hot", label: "📊 키별 QPS", metrics: [
              { l: "상품 TOP1 키", v: "12k QPS", s: "danger", u: "캐시 미스 시 DB 폭격" },
              { l: "롱테일 키", v: "분산", s: "warning", u: "배치만으로는 부족" }
            ]},
            { id: "mutex", label: "🔒 Mutex 실험", content: [
              { t: "", lv: "info", m: "staging: SETNX lock:sku:123 성공 시에만 DB 조회 — 동시 DB 1회로 감소 확인" }
            ]},
            { id: "batch", label: "📋 배치 워밍업 한계", content: [
              { t: "", lv: "warn", m: "Top 1000 워밍업 완료 — 여전히 MISS 38% (롱테일)" }
            ]}
          ]
        },
        freeFirst: "같은 인기 키에 수천 명이 동시에 MISS 나면 어떤 일이 벌어지나요? **Mutex**와 **배치 워밍업** 중 지금 당장 우선할 것은?",
        slack: { name: "인프라팀 정시니어", time: "10:14", body: "@backend-oncall Redis 새 마스터 `redis-prod-02` 승격 완료, **메모리 40% 여유**입니다. rate limit 걸린 상태니까 **mutex/워밍업 순서만 정해주시면** 제가 히트율 그래프 올려드릴게요. DB 쪽은 5분 넘기기 어렵다고 DBA님이 그러셨어요." },
        timer: 30,
        q: "캐시 워밍업을 어떻게?",
        hint: "같은 상품을 수천 명이 동시 조회하면 같은 DB 쿼리가 수천 번 실행됩니다.",
        ch: [
          { id: "A", text: "Mutex Lock: 캐시 미스 시 하나만 DB 조회, 나머지 대기", desc: "Redis SETNX로 락. 같은 키에 DB 쿼리 1번만.", g: "best", nx: "s4m" },
          { id: "B", text: "인기 상품 Top 1000 배치 캐싱", desc: "핫 데이터 우선 워밍업", g: "ok", nx: "s4m" },
          { id: "C", text: "TTL 랜덤 설정으로 동시 만료 방지", desc: "jitter로 만료 시점 분산", g: "ok", nx: "s4m" }
        ],
        fb: {
          A: { t: "🟢 Cache Stampede 방어 정석!", b: "**Mutex Lock 패턴**: 캐시 미스 시 SETNX 락, 성공하면 DB 조회+캐시 SET, 실패하면 짧게 대기 후 재시도. 같은 키에 **DB 쿼리 1번만**.", cost: "락 대기로 **지연(latency) 스파이크**가 날 수 있어 타임아웃·큐 설정이 필요합니다.", r: "Look-aside Cache + Mutex는 대규모 서비스 필수 패턴." },
          B: { t: "🟡 좋은 보조 전략", b: "핫 데이터 우선은 효과적이지만 롱테일 상품 조회 시 DB 부하 여전.", cost: "배치 작업이 **프로덕션 DB**에 부하를 줄 수 있습니다.", r: "" },
          C: { t: "🟡 예방용", b: "TTL jitter는 **다음 동시 만료 방지** 예방 전략. 이미 전체 초기화된 지금은 효과 없음.", cost: "지금 장면에서는 **즉시 효과 없음**.", r: "" }
        },
        tradeoff: [
          { option: "Mutex Lock", time: "즉시 적용", risk: "낮음", dataLoss: "없음", note: "DB 쿼리 1회만 실행" },
          { option: "배치 워밍업", time: "5~10분", risk: "낮음", dataLoss: "없음", note: "보조 전략" },
          { option: "TTL jitter", time: "다음 만료 시", risk: "없음", dataLoss: "없음", note: "예방만 가능" }
        ]
      },
      s4m: {
        time: "10:30", title: "재발 방지 — 캐시 운영 설계", phase: "postmortem",
        nar: ["캐시 히트율이 92%까지 복구되었습니다. 이제 포스트모템에서 **다시는 Redis OOM → Cache Stampede가 발생하지 않을 설계**를 제안해야 합니다.", "CTO: '캐시가 날아가면 또 DB가 죽는 구조를 근본적으로 바꿔야 합니다.'"],
        clues: {
          prompt: "캐시 운영 전략을 비교합니다.",
          options: [
            { id: "oom", label: "📋 OOM 원인", content: [
              { t: "", lv: "error", m: "maxmemory 4GB, 사용량 3.9GB — eviction policy: noeviction → OOM" },
              { t: "", lv: "info", m: "allkeys-lru로 변경 시 자동으로 오래된 키 삭제" }
            ]},
            { id: "ttl", label: "📊 TTL 분석", metrics: [
              { l: "TTL 없는 키", v: "23%", s: "danger", u: "메모리 누수 원인" },
              { l: "핫키 집중도", v: "상위 1%가 40%", s: "warning", u: "스탬피드 위험" }
            ]},
            { id: "warm", label: "🛠 워밍업 자동화", content: [
              { t: "", lv: "info", m: "배포·장애 후 자동 워밍업 스크립트 — Top 1000 키 사전 로드" },
              { t: "", lv: "warn", m: "프로모션 시작 30분 전 Cache Warming 배치 트리거" }
            ]}
          ]
        },
        freeFirst: "이번 OOM의 근본 원인은 **eviction policy**였습니다. maxmemory-policy를 어떻게 설정하고, 핫키 스탬피드를 구조적으로 방지할 전략을 적어보세요.",
        slack: { name: "CTO 박서연", time: "10:25", body: "복구 수고했습니다. 하지만 **Redis 죽으면 서비스 전체가 죽는 구조**가 문제예요. 이번 주 포스트모템에 **maxmemory 정책, 모니터링 알림, 워밍업 자동화** 세 가지 대책을 올려주세요." },
        q: "Redis 운영 안정화를 위해 어떤 대책을 도입하시겠습니까?",
        ch: [
          { id: "A", text: "maxmemory-policy 변경 + TTL 필수화 + 메모리 알림 + 워밍업 자동화", desc: "allkeys-lru, 모든 키 TTL 의무, 메모리 80% 알림, 배포/장애 후 자동 워밍업", g: "best", nx: "end",
            impact: { "OOM 재발": "구조적 방지", "스탬피드": "워밍업으로 완화", "운영 비용": "초기 1주" } },
          { id: "B", text: "메모리만 늘림 (4GB → 16GB)", desc: "스펙업으로 여유 확보", g: "ok", nx: "end",
            impact: { "OOM 재발": "일시적 완화", "스탬피드": "미해결", "운영 비용": "월 인프라 비용 증가" } }
        ],
        fb: {
          A: { t: "🟢 시니어급 운영 설계!", b: "**allkeys-lru**: 메모리 부족 시 자동 키 삭제로 OOM 방지. **TTL 필수화**: 메모리 누수 원인 제거. **워밍업 자동화**: 배포·장애 후 히트율 빠른 복구.", cost: "기존 키에 TTL을 소급 적용하는 **마이그레이션 작업**이 필요합니다.", r: "대규모 서비스는 Redis 메모리 80% 알림 + allkeys-lru를 기본으로 사용합니다." },
          B: { t: "🟡 미봉책", b: "메모리를 늘려도 eviction 없이 키가 쌓이면 **결국 다시 OOM**. 근본 원인이 남아있습니다.", cost: "월 인프라 비용만 커지고 **6개월 후 같은 사고**가 반복될 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "정책+모니터링+워밍업", time: "1주", risk: "매우 낮음", dataLoss: "없음", note: "근본 해결" },
          { option: "메모리 스펙업", time: "즉시", risk: "재발 높음", dataLoss: "없음", note: "임시 완화" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "Redis OOM 크래시 후 전체 캐시 초기화, 모든 요청이 DB로 몰리는 Cache Stampede.",
      qa: [
        { q: "Cache Stampede란?", a: "캐시 소실 시 많은 요청이 동시에 DB로 몰리는 현상. Mutex Lock, TTL jitter로 방지." },
        { q: "Redis 운영 핵심?", a: "maxmemory-policy(OOM 방지), Sentinel(고가용성), 앱 레벨 Mutex Lock." }
      ],
      checklist: [
        "카탈로그·상품 상세 API에서 @Cacheable(또는 look-aside) 쓸 때, **미스 난 키 하나에 요청이 동시에 몰리면** DB QPS가 몇 배로 뛰는지 로컬에서 부하 테스트로 확인해 보세요.",
        "Redis `maxmemory`와 `maxmemory-policy`가 설정돼 있나요? OOM으로 키가 통째로 날아가면 **장바구니·프로모션 캐시까지** 같이 사라질 수 있습니다. allkeys-lru 등 정책을 문서화해 두세요.",
        "베스트셀러·기획전처럼 **동시 만료**가 나지 않게 TTL에 jitter를 넣어 보세요. 예: 기본 TTL + Random(0, 300)초.",
        "Sentinel/Cluster 페일오버 시 앱이 **재연결·빈 캐시**를 가정하는지, 장애 runbook에 \"캐시 스탬피드 대응\" 한 줄이라도 적혀 있는지 점검하세요."
      ],
      pl: "물류 프로젝트에서 허브 정보를 캐싱했다면 Redis 장애 대응 전략을 포트폴리오에.",
      nextRec: [{id:"sc1",reason:"캐시 장애가 서비스 전체로 전파되는 Cascading Failure를 경험해보세요"},{id:"sc7",reason:"Redis 장애로 장바구니가 통째로 날아가는 사고를 경험해보세요"}],
      interviewQs: [
        "Cache Stampede(Thundering Herd)란 무엇이고, 어떻게 방지하나요?",
        "Redis의 maxmemory-policy 종류와 이커머스에서 어떤 정책을 선택해야 하는지 설명해주세요.",
        "캐시 장애 시 DB를 보호하면서 서비스를 유지하는 전략은 무엇인가요?"
      ],
      codeChallenge: {
        title: "Mutex Lock 패턴 캐시 조회 구현",
        prompt: "캐시 미스 시 동일 키에 대해 DB 쿼리가 한 번만 실행되도록 Redis SETNX 기반 Mutex Lock 패턴을 구현하세요.",
        starterCode: "@Service\npublic class ProductCacheService {\n\n    private final RedisTemplate<String, String> redis;\n    private final ProductRepository productRepo;\n\n    public Product getProduct(Long id) {\n        String key = \"product:\" + id;\n        String cached = redis.opsForValue().get(key);\n        if (cached != null) return deserialize(cached);\n\n        // TODO: Mutex Lock 패턴 구현\n        // 1. 락 획득 시도\n        // 2. 락 성공: DB 조회 → 캐시 SET → 락 해제\n        // 3. 락 실패: 잠시 대기 후 재시도\n        Product p = productRepo.findById(id).orElseThrow();\n        redis.opsForValue().set(key, serialize(p), Duration.ofMinutes(10));\n        return p;\n    }\n}",
        hint: "SETNX로 lock:{key}를 잡고, TTL을 짧게 설정하여 데드락을 방지하세요. 락 실패 시 Thread.sleep 후 캐시를 다시 확인합니다."
      }
    }
  },
  {
    id: "sc5", role: "백엔드 개발자", brief: "상품 목록 API가 20초나 걸립니다. 사용자의 78%가 페이지를 떠나고 있습니다.", why: "JPA를 쓰는 프로젝트에서 가장 먼저 겪는 성능 문제입니다. '상품 목록이 느린데 왜 그런지 모르겠어요'라고 하면 팀의 신뢰를 잃습니다.", title: "상품 목록 API가 20초씩 걸립니다",
    company: "트렌디숍 — 일 PV 500만 패션 커머스",
    tags: ["N+1 쿼리", "JPA", "Lazy Loading"], diff: "초급", dur: "10분", cat: "성능 문제", icon: "🐌", clr: "#f59e0b",
    nodes: {
      start: {
        time: "14:20", title: "상품 목록 API 성능 저하", phase: "investigate",
        nar: ["상품 목록 로딩 **20초 이상**. APM 확인: **50건 조회에 SQL 251개**."],
        clues: {
          prompt: "원인을 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "sql", label: "📋 실행된 SQL 로그", content: [
              { t: "14:20:01", lv: "info", m: "Hibernate: SELECT * FROM p_products LIMIT 50" },
              { t: "14:20:01", lv: "warn", m: "Hibernate: SELECT * FROM p_categories WHERE id = 1" },
              { t: "14:20:01", lv: "warn", m: "Hibernate: SELECT * FROM p_categories WHERE id = 2" },
              { t: "14:20:01", lv: "warn", m: "... (반복 248회)" }
            ]},
            { id: "metric", label: "📊 APM 메트릭", metrics: [
              { l: "API 응답", v: "20.3s", s: "danger", u: "목표 200ms" },
              { l: "SQL 쿼리 수", v: "251개", s: "danger", u: "1건 조회에 251쿼리" },
              { l: "DB CPU", v: "78%", s: "warning", u: "쿼리 폭증" }
            ]},
            { id: "code", label: "💻 Repository 코드", content: [
              { t: "", lv: "info", m: "// ProductRepository.java" },
              { t: "", lv: "info", m: "List<Product> findAll(Pageable pageable);" },
              { t: "", lv: "warn", m: "// Product.java" },
              { t: "", lv: "warn", m: "@ManyToOne(fetch = FetchType.LAZY)  // <-- Lazy Loading" },
              { t: "", lv: "warn", m: "private Category category;" },
              { t: "", lv: "warn", m: "@OneToMany(mappedBy = \"product\", fetch = FetchType.LAZY)" },
              { t: "", lv: "warn", m: "private List<Review> reviews;" }
            ]}
          ]
        },
        timer: 40,
        freeFirst: "SQL 로그와 코드를 보고, 왜 50건 조회에 251개 쿼리가 실행되는지 분석해보세요.",
        q: "이 현상의 원인은?",
        hint: "상품 50건인데 쿼리 251개. 1+50xN=251이면 N은?",
        ch: [
          { id: "A", text: "N+1 쿼리 - JPA Lazy Loading이 연관 엔티티를 개별 조회", desc: "상품 1건마다 카테고리, 리뷰를 별도 SELECT", g: "best", nx: "s5f" },
          { id: "B", text: "인덱스 미설정으로 풀 테이블 스캔", desc: "WHERE 절에 인덱스 없음", g: "ok", nx: "s5f" },
          { id: "C", text: "DB 커넥션 부족", desc: "커넥션 풀 확대 필요", g: "bad", nx: "s5_bad" }
        ],
        fb: {
          A: { t: "🟢 정확!", b: "**N+1 쿼리**: 목록 1회 + 각 상품마다 카테고리(50)+리뷰(50) 등 = 251. JPA **Lazy Loading**이 연관 엔티티 접근 시 개별 SELECT.", cost: "목록·검색이 느리면 **이탈·전환율 하락**으로 바로 연결됩니다. 원인 설명을 못 하면 실무/면접 모두에서 신뢰가 깎입니다.", r: "N+1은 JPA 프로젝트의 가장 흔한 성능 문제. 면접 단골." },
          B: { t: "🟡 부분적", b: "인덱스 문제라면 쿼리 수가 아니라 개별 쿼리 시간이 문제. 여기선 **쿼리 수** 자체가 핵심.", cost: "인덱스만 손대면 **251번의 왕복**은 그대로라 체감 속도는 거의 안 납니다.", r: "" },
          C: { t: "🔴 관련 없음", b: "커넥션 부족이면 Connection not available 에러. 여기선 쿼리 수 문제.", cost: "원인을 빗나가면 **DB·앱 튜닝 시간만 낭비**하고 기획전·딜 시간에 배포를 못 맞출 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "N+1 파악", time: "-", risk: "-", dataLoss: "-", note: "정확한 진단" },
          { option: "인덱스 추가", time: "개별 쿼리 개선", risk: "낮음", dataLoss: "없음", note: "쿼리 수는 줄지 않음" },
          { option: "커넥션 풀 확대", time: "-", risk: "없음", dataLoss: "없음", note: "관련 없는 조치" }
        ]
      },
      s5_bad: {
        time: "14:35", title: "커넥션 늘렸지만 변화 없음", phase: "action",
        nar: ["커넥션 풀을 200에서 500으로 늘렸지만 **응답시간은 여전히 20초**입니다.", "SQL 로그를 다시 보니 **쿼리 수가 251개**로 변함없습니다. 커넥션이 문제가 아니었습니다."],
        clues: {
          prompt: "왜 커넥션을 늘려도 효과가 없는지 확인합니다.",
          options: [
            { id: "sql2", label: "📋 SQL 카운트", content: [
              { t: "14:35", lv: "warn", m: "쿼리 수: 251개 (변화 없음) — 커넥션이 아니라 쿼리 수가 문제" },
              { t: "14:35", lv: "error", m: "커넥션 500개 중 사용: 12개 — 풀 확장은 무의미" }
            ]},
            { id: "apm2", label: "📊 APM 비교", metrics: [
              { l: "커넥션 풀", v: "500", s: "ok", u: "12개만 사용" },
              { l: "쿼리 수", v: "251개", s: "danger", u: "변화 없음" },
              { l: "응답시간", v: "20.1s", s: "danger", u: "변화 없음" }
            ]},
            { id: "hint2", label: "💡 Hibernate 로그 재확인", content: [
              { t: "", lv: "warn", m: "50건 조회 → 각 Product마다 Category SELECT → N+1 패턴 확인" }
            ]}
          ]
        },
        freeFirst: "커넥션을 늘렸는데 왜 안 빨라졌을까요? **병목이 커넥션 수가 아니라 다른 곳**에 있다면 어디일까요?",
        slack: { name: "프론트 김개발", time: "14:33", body: "PLP(상품목록) 아직 **TTI 20초** 찍혀요. 커넥션만 올렸다는데 APM에 쿼리 수 **251 그대로**인데요? 기획에 **오늘 오후 딜** 박혀 있어서 이대로는 못 올립니다. 원인 공유 부탁드려요." },
        timer: 20,
        q: "커넥션 문제가 아니었습니다. 진짜 원인은?",
        ch: [
          { id: "A", text: "N+1 쿼리 — JPA Lazy Loading이 개별 SELECT 발생", desc: "50건 각각에 연관 엔티티 추가 조회", g: "best", nx: "s5f",
            impact: { "진단": "정확", "시간 손실": "15분 허비" } },
          { id: "B", text: "인덱스 미설정이 원인", desc: "풀 테이블 스캔", g: "ok", nx: "s5f",
            impact: { "진단": "부분적", "시간 손실": "15분 허비" } }
        ],
        fb: {
          A: { t: "🟢 이제 정확한 진단", b: "**251개 쿼리**가 문제이지 커넥션 수가 아니었습니다. 15분을 허비했지만 이제 올바른 방향입니다.", cost: "15분간 **사용자 이탈이 계속** 발생한 비용을 포스트모템에서 회고해야 합니다.", r: "" },
          B: { t: "🟡 부분적 파악", b: "인덱스도 중요하지만, 지금 핵심은 **쿼리 개수(251개)**입니다. 인덱스는 개별 쿼리 속도만 개선합니다.", cost: "방향이 부분적이라 **추가 시간**이 더 필요할 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "N+1 해결", time: "즉시 효과", risk: "없음", dataLoss: "없음", note: "251→1~2 쿼리" },
          { option: "인덱스만", time: "부분 개선", risk: "없음", dataLoss: "없음", note: "쿼리 수 변화 없음" }
        ]
      },
      s5f: {
        time: "15:00", title: "N+1 해결", phase: "action",
        nar: ["N+1 원인이 확정되었습니다. **오후 기획전 오픈까지 2시간**. PM이 '상품 목록 20초면 고객 78%가 이탈한다'는 GA 데이터를 공유했습니다.", "지금 수정해서 배포하면 기획전 전까지 반영 가능합니다. 어떤 방식으로 해결할지 결정해야 합니다."],
        clues: {
          prompt: "해결책을 고르기 전, 각 접근의 부작용을 확인합니다.",
          options: [
            { id: "fj", label: "📋 Fetch Join 주의", content: [
              { t: "", lv: "warn", m: "컬렉션 Fetch Join + Pageable → **중복·메모리 폭증** 위험" },
              { t: "", lv: "info", m: "단일 연관(ManyToOne) 위주로는 안전" }
            ]},
            { id: "batch", label: "📊 @BatchSize", content: [
              { t: "", lv: "info", m: "IN 절 배치 — N+1 → 소수 쿼리로 감소" },
              { t: "", lv: "warn", m: "IN 절 크기 상한 — DB 설정 확인" }
            ]},
            { id: "eager", label: "⚠ Eager 전역", content: [
              { t: "", lv: "error", m: "다른 API에서 불필요한 JOIN 폭증 — **전역 성능 저하**" }
            ]}
          ]
        },
        freeFirst: "오늘 안에 배포해야 합니다. **Fetch Join**과 **@BatchSize** 중, 리스크를 어떻게 보시나요?",
        slack: { name: "프론트 김개발", time: "14:55", body: "GA에서 목록 **p95 20s** 계속 나옵니다. PM이 **전환율 대시보드** 캡처 보내주셨는데 이미 바닥이에요. Fetch Join / 배치 중 뭐로 갈지만 알려주시면 제가 스켈레톤·캐시 헤더 맞춰둘게요." },
        timer: 30,
        q: "어떤 방식?",
        ch: [
          { id: "A", text: "Fetch Join 또는 @EntityGraph", desc: "연관 엔티티 한 번에 조회", g: "best", nx: "s5v",
            impact: { "쿼리 수": "251 -> 1~2개", "응답시간": "20s -> 200ms", "주의사항": "컬렉션 페이징 주의" } },
          { id: "B", text: "@BatchSize로 IN절 배치", desc: "IN절로 묶어 조회", g: "ok", nx: "s5v",
            impact: { "쿼리 수": "251 -> 6개", "응답시간": "20s -> 400ms", "주의사항": "없음" } },
          { id: "C", text: "Eager Loading 전환", desc: "@ManyToOne(fetch=EAGER)", g: "bad", nx: "s5v",
            impact: { "쿼리 수": "항상 JOIN", "응답시간": "다른 API도 느려짐", "주의사항": "전체 성능 저하" } }
        ],
        fb: {
          A: { t: "🟢 가장 권장!", b: "**Fetch Join**은 251개를 **1~2개로 축소**. @EntityGraph는 어노테이션으로 간편. 단, 컬렉션 Fetch Join+페이징 시 주의.", cost: "도메인별로 조인 전략이 달라 **엔티티별 튜닝**이 필요할 수 있습니다.", r: "현업에서는 Fetch Join + @BatchSize를 상황에 맞게 조합." },
          B: { t: "🟡 좋은 대안", b: "@BatchSize는 유연하고 컬렉션 관계에서 안전.", cost: "쿼리 수는 줄어도 **여전히 여러 번** 나갈 수 있습니다.", r: "" },
          C: { t: "🔴 더 큰 문제!", b: "Eager는 **항상** 연관 엔티티 로드. 필요없는 곳에서도 JOIN 발생하여 **전체 성능 저하**.", cost: "팀 전체 API에 **예측 불가 부하**가 생깁니다.", r: "" }
        },
        tradeoff: [
          { option: "Fetch Join", time: "즉시", risk: "컬렉션 페이징 주의", dataLoss: "없음", note: "251 -> 1~2쿼리" },
          { option: "@BatchSize", time: "즉시", risk: "없음", dataLoss: "없음", note: "251 -> 6쿼리" },
          { option: "Eager Loading", time: "즉시", risk: "높음", dataLoss: "없음", note: "전체 API 성능 저하" }
        ]
      },
      s5v: {
        time: "15:30", title: "배포 후 검증 — 성능 확인", phase: "postmortem",
        nar: ["Fetch Join(또는 @BatchSize)을 적용하고 스테이징에서 쿼리 수를 확인했습니다. **251개 → 2개**로 줄었고, 응답시간은 **20s → 180ms**.", "하지만 PM이 '기획전 오픈 전에 **프로덕션에서도 확인**해달라'고 합니다. 배포 후 성능을 어떻게 검증하시겠습니까?"],
        clues: {
          prompt: "배포 후 성능 검증 방법을 비교합니다.",
          options: [
            { id: "p6spy", label: "📋 p6spy 로그", content: [
              { t: "", lv: "info", m: "p6spy: SELECT ... FROM p_products JOIN p_categories — 1 query, 180ms" },
              { t: "", lv: "info", m: "바인딩 파라미터까지 로그 출력 — 실행 계획 확인 가능" }
            ]},
            { id: "apm", label: "📊 APM 비교", metrics: [
              { l: "수정 전", v: "251 쿼리 / 20s", s: "danger", u: "" },
              { l: "수정 후", v: "2 쿼리 / 180ms", s: "ok", u: "99% 개선" },
              { l: "DB CPU", v: "78% → 12%", s: "ok", u: "정상 범위" }
            ]},
            { id: "risk", label: "⚠ 배포 리스크", content: [
              { t: "", lv: "warn", m: "Fetch Join 변경으로 다른 API에서 예상치 못한 쿼리 변화 가능" },
              { t: "", lv: "info", m: "show-sql + 슬로우 쿼리 로그로 사이드 이펙트 모니터링" }
            ]}
          ]
        },
        freeFirst: "쿼리 수는 줄었지만, 프로덕션 배포 후 **사이드 이펙트가 없는지** 어떻게 확인하시겠어요? 모니터링해야 할 지표를 적어보세요.",
        slack: { name: "PM 이주현", time: "15:25", body: "스테이징 180ms 확인했습니다! **배포 부탁드려요.** 단, 기획전 트래픽이 평소 3배니까 **배포 후 30분간 모니터링** 같이 봐주실 수 있나요? GA에서 PLP 전환율 실시간으로 올려놓을게요." },
        q: "프로덕션 배포 후 어떻게 검증하시겠습니까?",
        ch: [
          { id: "A", text: "p6spy + APM 대시보드 + 슬로우 쿼리 알림 + 전환율 모니터링", desc: "쿼리 로그, 응답시간 대시보드, DB 슬로우 쿼리 알림, 비즈니스 지표 병행", g: "best", nx: "end",
            impact: { "기술 검증": "쿼리 수·응답시간", "비즈니스 검증": "전환율·이탈률", "사이드 이펙트": "슬로우 쿼리 알림" } },
          { id: "B", text: "배포 후 수동 확인 (API 호출 테스트)", desc: "curl로 몇 번 호출해서 응답시간 확인", g: "ok", nx: "end",
            impact: { "기술 검증": "샘플 수준", "비즈니스 검증": "없음", "사이드 이펙트": "놓칠 수 있음" } }
        ],
        fb: {
          A: { t: "🟢 현업 수준 검증!", b: "**기술 지표(쿼리 수, 응답시간) + 비즈니스 지표(전환율, 이탈률)** 두 축으로 검증. 슬로우 쿼리 알림으로 사이드 이펙트도 감지.", cost: "대시보드·알림 세팅에 **30분~1시간** 추가 소요되지만, 기획전 트래픽에서의 안전을 보장합니다.", r: "현업에서는 쿼리 튜닝 후 반드시 APM 기반 A/B 비교를 합니다." },
          B: { t: "🟡 부분적", b: "수동 테스트는 **정상 케이스만 확인**. 트래픽 급증 시 페이징, 컬렉션 조인 문제 등은 놓칠 수 있습니다.", cost: "기획전 피크에서 **예상치 못한 슬로우 쿼리**가 터지면 대응이 늦어집니다.", r: "" }
        },
        tradeoff: [
          { option: "APM+알림+비즈니스 지표", time: "30분 세팅", risk: "매우 낮음", dataLoss: "없음", note: "종합 검증" },
          { option: "수동 테스트만", time: "5분", risk: "사이드 이펙트 놓칠 수 있음", dataLoss: "없음", note: "샘플 확인" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "JPA Lazy Loading N+1 쿼리. 상품 50건 조회 시 연관 엔티티 개별 SELECT 251회.",
      qa: [
        { q: "N+1이란? 해결법?", a: "목록 조회 후 N건 각각에 추가 쿼리. Fetch Join, @EntityGraph, @BatchSize로 해결." },
        { q: "Fetch Join vs @BatchSize?", a: "Fetch Join: 쿼리 1개로 축소, 컬렉션 페이징 제한. @BatchSize: IN절로 유연하게 줄임." }
      ],
      checklist: [
        "로컬에서 `spring.jpa.show-sql=true` 켠 뒤 **카테고리 PLP 한 페이지**를 호출해 보세요. SELECT가 **상품 수+α**로 늘어나면 N+1 후보입니다.",
        "문제되는 연관(카테고리·옵션·썸네일)을 집어 `@EntityGraph` 또는 **Fetch Join JPQL**로 한 번에 가져오도록 바꾼 뒤, 쿼리 수가 **1~3개**로 줄었는지 확인하세요.",
        "같은 엔티티에 `@BatchSize(size=50~100)`을 넣고 로그를 비교해 보세요. IN 절로 묶이면 **완화 단계**로 적합한지 판단할 수 있습니다.",
        "p6spy(또는 datasource-proxy)로 **실행 SQL + 바인딩**을 남기고, 스테이징 데이터로 **기획전 기간 PLP**를 한 번 돌려 보세요."
      ],
      pl: "물류 프로젝트 주문+배송 목록 조회 시 N+1 발생 가능. Fetch Join 적용 어필.",
      nextRec: [{id:"sc7",reason:"Redis 의존 데이터 유실 사고를 경험하고 캐시 전략을 점검해보세요"},{id:"sc4",reason:"DB 부하를 줄이는 캐시 전략도 중요합니다"}],
      interviewQs: [
        "JPA의 N+1 문제가 무엇이고, 왜 발생하며, 어떻게 해결하나요?",
        "Fetch Join과 @BatchSize의 차이점과 각각 어떤 상황에 적합한지 설명해주세요.",
        "프로덕션에서 느린 쿼리를 발견하고 해결한 경험이 있나요? 어떤 도구를 사용했나요?"
      ],
      codeChallenge: {
        title: "N+1 문제 해결 — Fetch Join JPQL 작성",
        prompt: "상품 목록 조회 시 카테고리, 옵션, 썸네일 연관 엔티티 때문에 N+1 쿼리가 발생합니다. Fetch Join JPQL을 작성하여 쿼리를 1~2개로 줄이세요.",
        starterCode: "// ProductRepository.java\npublic interface ProductRepository extends JpaRepository<Product, Long> {\n\n    // 기존: N+1 발생\n    List<Product> findAll(Pageable pageable);\n\n    // TODO: Fetch Join으로 N+1 해결\n    // @Query(\"...\")\n    // List<Product> findAllWithDetails(Pageable pageable);\n}\n\n// Product.java\n@Entity\npublic class Product {\n    @Id private Long id;\n    private String name;\n\n    @ManyToOne(fetch = FetchType.LAZY)\n    private Category category;\n\n    @OneToMany(mappedBy = \"product\", fetch = FetchType.LAZY)\n    private List<ProductOption> options;\n}",
        hint: "JOIN FETCH로 @ManyToOne 연관을 한 번에 가져오세요. @OneToMany 컬렉션은 @BatchSize 또는 @EntityGraph가 더 안전합니다 (페이징 주의)."
      }
    }
  },
  {
    id: "sc6", role: "백엔드 개발자 (배포 담당)", brief: "할인 로직을 배포했는데 결제 금액이 0원으로 찍힙니다. 5분간 127건의 무료 주문이 발생했습니다.", why: "모든 개발자가 한 번은 겪는 배포 사고입니다. 롤백 한 번 못 하면 프로덕션에 투입될 수 없습니다. 이커머스에서 가격 버그는 곧 매출 손실입니다.", title: "배포했는데 결제 금액이 0원으로 찍힌다",
    company: "페이마트 — 월 거래액 200억 결제 플랫폼",
    tags: ["배포 롤백", "카나리 배포", "Feature Flag"], diff: "중급", dur: "10분", cat: "배포/운영", icon: "🚀", clr: "#8b5cf6",
    nodes: {
      start: {
        time: "10:35", title: "배포 직후 — 결제 금액 이상", phase: "investigate",
        nar: ["오전 10:30, 할인 로직 개선 코드 배포.", "5분 후 CS: 결제 금액이 **0원**! 할인율 계산 버그로 **100% 할인** 적용."],
        clues: {
          prompt: "상황을 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "cs", label: "📞 CS 접수 현황", metrics: [
              { l: "0원 결제", v: "127건", s: "danger", u: "5분간" },
              { l: "예상 손실", v: "약 890만원", s: "danger", u: "무료 상품 가치" },
              { l: "CS 인입", v: "54건", s: "warning", u: "급증 중" }
            ]},
            { id: "deploy", label: "🚀 배포 이력", content: [
              { t: "10:28", lv: "info", m: "Deploy started: discount-service v2.3.1" },
              { t: "10:30", lv: "info", m: "Deploy completed: 4/4 pods rolling updated" },
              { t: "10:31", lv: "warn", m: "discount rate calculation changed in DiscountPolicy.java" }
            ]},
            { id: "log", label: "📋 할인 계산 로그", content: [
              { t: "10:31:05", lv: "error", m: "DiscountPolicy.calculate: rate=1.0 (100%) for coupon WELCOME_10" },
              { t: "10:31:05", lv: "info", m: "Original price: 89000, Discount: 89000, Final: 0" },
              { t: "10:31:06", lv: "error", m: "BUG: percentage / 100 missing -> 10% treated as 100%" }
            ]}
          ]
        },
        timer: 30,
        freeFirst: "배포 직후 버그가 발견되었습니다. 가장 먼저 무엇을 해야 할까요? 선택지를 보기 전에 적어보세요.",
        q: "즉시 어떤 조치를 취하시겠습니까?",
        hint: "배포 후 문제 발견 시 가장 먼저 해야 할 일은?",
        ch: [
          { id: "A", text: "즉시 이전 버전으로 롤백", desc: "kubectl rollout undo", g: "best", nx: "s6cleanup",
            impact: { "0원 결제": "즉시 중단", "복구 시간": "1분", "추가 위험": "없음" } },
          { id: "B", text: "버그 수정 핫픽스 배포", desc: "할인율 로직 수정 후 재배포", g: "bad", nx: "s6_bad",
            impact: { "0원 결제": "15분간 계속", "복구 시간": "15분", "추가 위험": "핫픽스 버그 가능" } },
          { id: "C", text: "결제 API 일시 차단", desc: "추가 피해 방지", g: "ok", nx: "s6cleanup",
            impact: { "0원 결제": "즉시 중단", "복구 시간": "즉시", "추가 위험": "전체 주문 중단" } }
        ],
        fb: {
          A: { t: "🟢 최우선 조치!", b: "**Roll forward보다 rollback이 먼저** — 현업 철칙. 롤백은 검증된 이전 버전. 핫픽스는 새 코드로 추가 버그 위험. 롤백 1분, 핫픽스 15분.", cost: "이미 발생한 **0원 주문·정산 차이**는 남지만, 추가 피해를 막는 데 가장 짧은 레버입니다.", r: "대부분 기업에서 배포 5분 내 문제 시 자동 롤백(Auto Rollback) 설정." },
          B: { t: "🟡 시간 걸리고 위험", b: "수정, 리뷰, 빌드, 배포 최소 15분. 그 동안 0원 결제 계속. **핫픽스도 새 코드이므로 추가 버그 가능.**", cost: "그 사이 **매출·재고·프로모션 예산**이 계속 새고, CS·재무가 동시에 터집니다.", r: "" },
          C: { t: "🟡 과도한 조치", b: "정상 주문까지 전부 중단. 롤백이 가능한 상황에서 **불필요한 비즈니스 피해**.", cost: "결제만 막으면 **정상 고객 매출 전체**가 멈춰 이커머스에서는 최후의 수단에 가깝습니다.", r: "" }
        },
        tradeoff: [
          { option: "롤백", time: "1분", risk: "없음", dataLoss: "없음", note: "검증된 이전 버전" },
          { option: "핫픽스", time: "15분", risk: "새 버그 가능", dataLoss: "15분간 0원 결제", note: "급하면 실수 유발" },
          { option: "API 차단", time: "즉시", risk: "매출 중단", dataLoss: "없음", note: "롤백이 더 나은 선택" }
        ]
      },
      s6_bad: {
        time: "10:45", title: "핫픽스 시도 — 15분간 추가 피해", phase: "action",
        nar: ["버그를 수정하고 핫픽스를 배포하기 시작했습니다. 코드 수정 → 빌드 → 배포 파이프라인이 돌아가는 동안 **0원 결제가 계속 발생**합니다.", "15분 후 핫픽스가 배포되었지만, 그 사이 **추가 89건의 0원 결제**가 발생하여 **총 216건, 약 1,530만 원**의 손실로 늘어났습니다."],
        clues: {
          prompt: "핫픽스 동안 무슨 일이 벌어졌는지 확인합니다.",
          options: [
            { id: "timeline", label: "📋 타임라인", content: [
              { t: "10:35", lv: "error", m: "버그 발견 — 핫픽스 결정" },
              { t: "10:36~10:48", lv: "warn", m: "코드 수정 + 코드 리뷰 + 빌드 — 0원 결제 계속 발생 중" },
              { t: "10:48", lv: "info", m: "핫픽스 배포 완료 — 0원 결제 중단" },
              { t: "10:48", lv: "error", m: "추가 피해: 89건, ~640만 원 (총 216건, ~1,530만 원)" }
            ]},
            { id: "compare", label: "📊 롤백 vs 핫픽스 비교", metrics: [
              { l: "롤백", v: "1분", s: "ok", u: "추가 피해 0건" },
              { l: "핫픽스", v: "15분", s: "danger", u: "추가 89건" },
              { l: "손실 차이", v: "+640만원", s: "danger", u: "핫픽스 대가" }
            ]},
            { id: "risk", label: "⚠ 핫픽스 리스크", content: [
              { t: "", lv: "warn", m: "급하게 짠 코드 — 리뷰 부실 — 또 다른 버그 가능성" },
              { t: "", lv: "info", m: "이번엔 운 좋게 정상 동작했지만, 핫픽스가 또 버그면 3차 배포 필요" }
            ]}
          ]
        },
        freeFirst: "**롤백 1분 vs 핫픽스 15분**. 그 14분의 차이가 **89건, 640만 원**이 되었습니다. 다음에 같은 상황이면 어떤 선택을 하시겠어요?",
        slack: { name: "재무팀 이과장", time: "10:50", body: "0원 결제가 **216건**이래요. 127건이라고 했는데 언제 89건이 더 늘어난 거예요? 핫픽스 배포 동안 계속 풀린 거잖아요. **롤백이 1분이었으면** 이 89건은 없었을 텐데…" },
        met: [
          { l: "총 0원 결제", v: "216건", s: "danger", u: "127 + 89건" },
          { l: "총 손실", v: "~1,530만원", s: "danger", u: "890 + 640만원" },
          { l: "핫픽스 시간", v: "15분", s: "warning", u: "롤백이면 1분" }
        ],
        timer: 20,
        q: "핫픽스의 대가를 체감했습니다. 이제 216건을 어떻게 수습하시겠습니까?",
        ch: [
          { id: "A", text: "0원 결제 건 DB 추출 → 상품 회수 or 차액 청구 + 고객 안내", desc: "영향 고객 식별 후 정산 보정, 고객 안내 발송", g: "best", nx: "s6cleanup",
            impact: { "정산": "DB 기반 정확", "고객": "안내+보상", "시간": "1~2시간" } },
          { id: "B", text: "별도 대응 없이 손실 처리", desc: "금액이 크지 않으므로 마케팅 비용으로 처리", g: "ok", nx: "s6cleanup",
            impact: { "정산": "간단", "고객": "대응 없음", "시간": "즉시" } }
        ],
        fb: {
          A: { t: "🟢 책임 있는 수습", b: "0원 결제 건을 정확히 추출하고 **정산 보정 + 고객 안내**까지 하는 것이 정석입니다. 금액이 작아 보여도 **세금계산서, 재고, 정산** 모두 꼬입니다.", cost: "CS·재무·물류 3개 팀이 **동시 투입**되어야 합니다.", r: "" },
          B: { t: "🟡 단기엔 가능하지만 위험", b: "1,530만 원을 마케팅 비용으로 처리할 수 있지만, **재고 불일치·세금계산서 오류**가 나중에 터집니다.", cost: "세무 감사 시 **0원 결제 216건**에 대한 소명이 필요할 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "DB 추출+보정+안내", time: "1~2시간", risk: "낮음", dataLoss: "없음", note: "깔끔한 수습" },
          { option: "손실 처리", time: "즉시", risk: "세무·재고 리스크", dataLoss: "없음", note: "나중에 문제" }
        ]
      },
      s6cleanup: {
        time: "10:50", title: "0원 결제 수습", phase: "action",
        nar: ["롤백(또는 핫픽스)으로 추가 피해는 막았습니다. 이제 **이미 발생한 0원 결제 건**을 처리해야 합니다.", "재무팀: '결제 금액이 0원인 건은 세금계산서를 발행할 수 없습니다. **정산 전에 정리**해주세요.'"],
        clues: {
          prompt: "0원 결제 건 수습 전략을 세웁니다.",
          options: [
            { id: "extract", label: "🗃 데이터 추출", content: [
              { t: "", lv: "info", m: "SELECT * FROM p_orders WHERE final_price=0 AND created_at BETWEEN '10:30' AND '10:50'" },
              { t: "", lv: "warn", m: "할인 쿠폰 적용 주문 중 **정상 0원 건(100% 쿠폰)**과 구분 필요" },
              { t: "", lv: "info", m: "BUG 태깅: discount_service_version='v2.3.1' 조건 추가" }
            ]},
            { id: "options", label: "📋 처리 방안", content: [
              { t: "", lv: "info", m: "A안: 차액 재청구 — PG 부분 결제 API 호출" },
              { t: "", lv: "warn", m: "B안: 주문 취소 + 재주문 안내 — 고객 번거로움" },
              { t: "", lv: "info", m: "C안: 손실 감수 + 보상 쿠폰 — 브랜드 호감 전환" }
            ]},
            { id: "impact", label: "📊 비용 비교", metrics: [
              { l: "차액 재청구", v: "회수율 높음", s: "ok", u: "고객 불만 가능" },
              { l: "주문 취소", v: "이탈 위험", s: "warning", u: "재주문율 60%" },
              { l: "손실 감수", v: "~890만원", s: "danger", u: "세금·재고 이슈" }
            ]}
          ]
        },
        freeFirst: "0원 결제 고객 127명에게 보낼 **안내 메시지**를 작성해보세요. 사과 + 상황 설명 + 처리 방안을 포함해야 하고, 고객이 화나지 않을 톤이어야 합니다.",
        slack: { name: "CS팀 이수진", time: "10:48", body: "0원 결제 고객들한테 연락 가야 하는데, **'축하합니다 0원에 당첨!'이라고 보낼 순 없잖아요.** 어떤 톤으로 안내할지 빨리 정해주세요. 벌써 문의 들어오기 시작했어요." },
        timer: 25,
        q: "0원 결제 건을 어떻게 처리하시겠습니까?",
        ch: [
          { id: "A", text: "고객 안내 + 차액 재청구 (동의 시) / 보상 쿠폰 (거부 시)", desc: "투명한 안내 후 고객 선택권 제공", g: "best", nx: "s6a",
            impact: { "회수율": "70~80%", "고객 만족": "투명 소통", "브랜드": "긍정적" } },
          { id: "B", text: "전액 손실 감수 + 감사 쿠폰 발송", desc: "마케팅 비용으로 전환, 고객 호감", g: "ok", nx: "s6a",
            impact: { "회수율": "0%", "고객 만족": "매우 높음", "브랜드": "긍정적 (비용 큼)" } }
        ],
        fb: {
          A: { t: "🟢 균형 잡힌 대응", b: "**투명하게 상황을 알리고 고객에게 선택권**을 주는 것이 장기적으로 가장 좋은 전략입니다. 대부분의 고객은 정상 결제에 동의합니다.", cost: "차액 재청구 **PG API 연동**과 CS 인력 투입이 필요합니다.", r: "아마존, 쿠팡 등은 가격 오류 시 고객에게 선택권(취소/정상가 결제)을 제공합니다." },
          B: { t: "🟡 관대하지만 비용 큼", b: "고객 호감은 얻지만, **890만~1,530만 원의 손실 + 세금계산서 이슈 + 재고 정합성** 문제가 남습니다.", cost: "경영진이 **'왜 회수 안 했나'**고 물을 수 있습니다. 금액 규모에 따라 판단.", r: "" }
        },
        tradeoff: [
          { option: "안내+차액+보상", time: "2~3시간", risk: "낮음", dataLoss: "없음", note: "70~80% 회수" },
          { option: "전액 손실 감수", time: "30분", risk: "재무 이슈", dataLoss: "없음", note: "고객 호감" }
        ]
      },
      s6a: {
        time: "11:30", title: "재발 방지 — 배포 안전장치", phase: "postmortem",
        nar: ["0원 결제 수습이 진행 중입니다. 이제 포스트모템에서 **다시는 이런 사고가 나지 않을 장치**를 제안해야 합니다.", "이번 사고의 타임라인: **배포 5분 만에 발견 → 롤백(or 핫픽스) → 0원 결제 수습**. 카나리 배포가 있었다면 **5% 트래픽, 약 6건**에서 잡혔을 것입니다."],
        clues: {
          prompt: "재발 방지안을 설득하기 위한 근거를 모읍니다.",
          options: [
            { id: "post", label: "📋 포스트모템 요약", content: [
              { t: "", lv: "info", m: "원인: 할인율 단위 버그 — 코드 리뷰에서 **경계값 테스트 누락**" },
              { t: "", lv: "warn", m: "스테이징 데이터가 프로덕션과 **금액 분포 상이**" },
              { t: "", lv: "error", m: "카나리 배포가 있었다면 **5% × 127건 ≈ 6건**에서 조기 발견" }
            ]},
            { id: "tools", label: "🛠 도구 비교", content: [
              { t: "", lv: "info", m: "Feature Flag: 배포는 하되 **할인 로직만 OFF** 가능" },
              { t: "", lv: "info", m: "카나리: 에러율·결제 0원 건수 알람 연동" },
              { t: "", lv: "info", m: "자동 롤백: 결제 금액 이상 감지 시 즉시 롤백" }
            ]},
            { id: "cost2", label: "💰 이번 사고 비용", metrics: [
              { l: "직접 손실", v: "890만~1,530만", s: "danger", u: "0원 결제" },
              { l: "CS·재무 인력", v: "3팀 투입", s: "warning", u: "2일간" },
              { l: "카나리 도입 비용", v: "1~2주", s: "ok", u: "재발 방지" }
            ]}
          ]
        },
        freeFirst: "QA 강화만으로는 부족하다고 했을 때, **프로덕션에서 막는 장치**로 무엇을 제일 먼저 도입하시겠어요?",
        slack: { name: "CTO 박서연", time: "11:20", body: "수습 감사합니다. 다만 **이번 비용이 최소 890만 원**이에요. 카나리가 있었으면 6건에서 잡았을 거예요. 이번 주 금요일 포스트모템에 **카나리/FF/자동 롤백** 중 우선순위랑 일정 같이 올려주세요. 경영진 브리핑에 올라갈 수 있습니다." },
        q: "배포 프로세스에 어떤 안전장치를 추가하시겠습니까?",
        ch: [
          { id: "A", text: "카나리 배포 + 자동 롤백 + Feature Flag", desc: "5% 트래픽 검증, 에러율 급증 시 자동 롤백, 기능 ON/OFF", g: "best", nx: "end",
            impact: { "카나리": "5% 트래픽으로 검증", "자동 롤백": "에러율 임계치 초과 시", "Feature Flag": "코드 배포와 기능 분리" } },
          { id: "B", text: "스테이징 QA 강화", desc: "배포 전 테스트 철저히", g: "ok", nx: "end",
            impact: { "QA 커버리지": "높아짐", "프로덕션 방어": "없음", "비용": "QA 시간 증가" } }
        ],
        fb: {
          A: { t: "🟢 현업 배포 안전장치 3종 세트!", b: "**카나리**: 5%로 검증 후 확대. **자동 롤백**: 결제 금액 이상 감지 시 즉시. **Feature Flag**: 코드 배포와 기능 활성화 분리. 이번 사고가 6건에서 잡혔을 것.", cost: "인프라·플랫폼 팀과 **SLA·알림 룰**을 맞추는 초기 비용이 듭니다.", r: "쿠팡, 토스, 네이버 등 모두 사용." },
          B: { t: "🟡 필요하지만 부족", b: "QA가 아무리 철저해도 프로덕션 모든 케이스 커버 불가. **프로덕션에서의 안전장치가 추가로 필요.**", cost: "사람 의존도가 높아 **릴리즈 속도**와 트레이드오프가 납니다.", r: "" }
        },
        tradeoff: [
          { option: "카나리+자동롤백+FF", time: "구축 1~2주", risk: "매우 낮음", dataLoss: "최소 5%", note: "현업 표준" },
          { option: "QA 강화만", time: "지속적", risk: "중간", dataLoss: "100% 영향", note: "프로덕션 방어 없음" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "할인율 단위 버그(% → 소수점 변환 누락)가 QA 통과하여 프로덕션 배포. 카나리/자동 롤백 부재로 0원 결제 발생.",
      qa: [
        { q: "배포 후 버그 발견 시 첫 행동은?", a: "핫픽스보다 롤백이 먼저. 롤백 1분 vs 핫픽스 15분. 검증된 이전 버전이 항상 더 안전." },
        { q: "카나리 배포란?", a: "새 버전을 5~10% 트래픽에만 적용하여 검증. 문제 시 영향 최소화." },
        { q: "Feature Flag 왜?", a: "코드 배포와 기능 활성화 분리. 배포 후에도 ON/OFF로 위험 관리." }
      ],
      checklist: [
        "`kubectl rollout undo` 또는 `docker-compose` 이전 이미지 태그 롤백 명령어를 즉시 실행할 수 있도록 준비하세요.",
        "배포 후 5분간 **결제 금액 0원 건수, 에러율, 응답 시간**을 모니터링하는 알림을 설정하세요.",
        "할인/가격 관련 코드에 **경계값 테스트**(0%, 100%, 소수점)를 추가하세요.",
        "Feature Flag로 할인 로직을 분리해서, 배포와 기능 활성화를 독립시킬 수 있는지 검토하세요."
      ],
      pl: "물류 프로젝트 Docker 배포에 카나리 전략 적용 어필.",
      nextRec: [{id:"sc10",reason:"배포 후 문제를 빠르게 감지하려면 모니터링이 필수입니다"},{id:"sc1",reason:"배포 실패가 장애로 이어지는 시나리오를 경험해보세요"}],
      interviewQs: [
        "프로덕션에 배포한 직후 심각한 버그를 발견하면 가장 먼저 무엇을 하시겠습니까?",
        "카나리 배포와 Feature Flag의 차이점, 그리고 각각 어떤 상황에 적합한지 설명해주세요.",
        "배포 후 발생한 금전적 피해(예: 0원 결제)를 기술적으로 수습한 경험이나 계획을 말해주세요."
      ],
      codeChallenge: {
        title: "카나리 배포 설정 작성",
        prompt: "Kubernetes에서 카나리 배포를 설정하여 새 버전을 5% 트래픽에만 먼저 배포하고, 에러율이 5%를 넘으면 자동 롤백되도록 설정하세요.",
        starterCode: "# canary-deploy.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: discount-service-canary\nspec:\n  replicas: 1  # 전체 20대 중 1대 = 5%\n  selector:\n    matchLabels:\n      app: discount-service\n      track: canary\n  template:\n    spec:\n      containers:\n      - name: app\n        image: discount-service:v2.3.2\n---\n# TODO: 자동 롤백 조건 설정\n# 1. Prometheus 메트릭 기반 에러율 모니터링\n# 2. 에러율 > 5% 시 자동 롤백 트리거\n# 3. 정상 시 점진적 트래픽 증가 (5% -> 25% -> 50% -> 100%)",
        hint: "Argo Rollouts의 AnalysisTemplate이나 Flagger를 활용하면 메트릭 기반 자동 롤백이 가능합니다."
      }
    }
  },
  {
    id: "sc7", role: "백엔드 개발자 (장바구니/세션 담당)", brief: "아침에 출근했더니 CS팀이 난리입니다. 새벽 프로모션 대기 고객 12,000명의 장바구니가 전부 텅 비어 있습니다.", why: "장바구니를 Redis에만 저장하는 실수는 이커머스에서 가장 흔한 설계 실수 중 하나입니다. 세션/캐시 전략을 모르면 대형 사고를 냅니다.", title: "프로모션 시작했는데 장바구니가 텅 비었다",
    company: "쇼핑온 — MAU 600만 종합 커머스",
    tags: ["Redis 장애", "세션 관리", "데이터 영속성"], diff: "중급", dur: "12분", cat: "인프라 장애", icon: "🛒", clr: "#06b6d4",
    nodes: {
      start: {
        time: "08:15", title: "장바구니 전면 유실", phase: "investigate",
        nar: ["월요일 아침 8시. 오전 9시 시작 예정인 **봄맞이 최대 50% 할인 프로모션**.", "새벽에 미리 장바구니에 상품을 담아둔 고객이 **12,000명 이상**.", "그런데 지금 장바구니 API 응답이 전부 **빈 배열([])**입니다."],
        alerts: [
          { level: "critical", msg: "CS 인입 폭증 — '장바구니 다 사라졌어요' 120건/10분" },
          { level: "critical", msg: "cart-service: Redis GET cart:{userId} → (nil) 100%" },
          { level: "warning", msg: "SNS: '#쇼핑온_장바구니_증발' 실시간 트렌드 진입" }
        ],
        clues: {
          prompt: "장바구니 데이터가 사라진 원인을 찾기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "redis", label: "📋 Redis 클러스터 로그", content: [
              { t: "03:00", lv: "info", m: "Redis Cluster: Node redis-03 maintenance rebalance started" },
              { t: "03:12", lv: "warn", m: "Slot migration 5461-10922: 2,847 keys EXPIRED during migration" },
              { t: "03:14", lv: "error", m: "Node redis-03 rejoined — slot ownership transferred, previous keys NOT restored" }
            ]},
            { id: "arch", label: "🏗 장바구니 아키텍처", content: [
              { t: "", lv: "error", m: "CartService: Redis ONLY (no DB backup)" },
              { t: "", lv: "warn", m: "Key: cart:{userId}, TTL: 7d, Persistence: RDB only (1h interval)" },
              { t: "", lv: "info", m: "Last RDB snapshot: 02:00 — 슬롯 마이그레이션(03:00) 이전" }
            ]},
            { id: "metric", label: "📊 영향 범위", metrics: [
              { l: "유실 장바구니", v: "~12,000건", s: "danger", u: "활성 고객" },
              { l: "평균 담긴 금액", v: "8.7만원", s: "warning", u: "건당" },
              { l: "예상 매출 영향", v: "~10.4억", s: "danger", u: "전환율 기준" }
            ]}
          ]
        },
        timer: 40,
        freeFirst: "장바구니 데이터가 Redis에만 있었다면, Redis 장애 시 데이터를 복구할 방법이 있을까요? 없다면 왜 없는지 적어보세요.",
        q: "장바구니 유실의 근본 원인은?",
        hint: "장바구니 데이터가 저장된 곳이 Redis뿐이라면, Redis에 문제가 생기면?",
        ch: [
          { id: "A", text: "Redis Cluster 슬롯 마이그레이션 중 키 유실 — DB 백업 없음", desc: "장바구니가 Redis에만 저장되어 있어 슬롯 이동 시 데이터 소실", g: "best", nx: "s7fix",
            impact: { "원인": "정확 파악", "복구": "RDB 스냅샷 활용 가능" } },
          { id: "B", text: "세션 TTL이 만료된 것", desc: "7일 TTL이 지나서 자동 삭제", g: "bad", nx: "s7_bad",
            impact: { "원인": "잘못된 방향", "복구": "효과 없음" } },
          { id: "C", text: "배포 시 Redis flush 명령 실행", desc: "잘못된 운영 명령", g: "ok", nx: "s7fix",
            impact: { "원인": "부분적", "복구": "운영 로그 확인" } }
        ],
        fb: {
          A: { t: "🟢 정확한 진단!", b: "Redis Cluster 슬롯 리밸런싱 시 **키 마이그레이션이 완전하지 않으면 데이터 유실**이 발생합니다. 근본 원인은 **장바구니를 Redis에만 저장한 설계**입니다.", cost: "프로모션 시작까지 **45분** 남았습니다. 복구와 고객 대응을 동시에 해야 합니다.", r: "쿠팡, 마켓컬리 등은 장바구니를 DB에 저장하고 Redis는 캐시로만 사용합니다." },
          B: { t: "🔴 방향 오류", b: "TTL 7일이면 새벽에 담은 장바구니가 만료될 이유가 없습니다. **Redis 인프라 문제**를 봐야 합니다.", cost: "잘못된 진단으로 **시간을 낭비**하면 프로모션 시작 전 복구가 불가합니다.", r: "" },
          C: { t: "🟡 가능성 있으나 이번 건은 아님", b: "운영 로그를 확인하면 flush 명령 없음. **슬롯 마이그레이션 로그**가 핵심 단서.", cost: "운영 명령 추적에 **시간을 쓰면** 진짜 원인 발견이 늦어집니다.", r: "" }
        },
        tradeoff: [
          { option: "슬롯 마이그레이션 진단", time: "5분", risk: "없음", dataLoss: "없음", note: "정확한 원인" },
          { option: "TTL 연장", time: "1분", risk: "없음", dataLoss: "이미 유실", note: "효과 없음" },
          { option: "운영 로그 추적", time: "15분", risk: "없음", dataLoss: "없음", note: "이번 건은 아님" }
        ]
      },
      s7_bad: {
        time: "08:30", title: "TTL 연장 — 유실 계속", phase: "action",
        nar: ["장바구니 TTL을 7일에서 30일로 늘렸지만 **이미 사라진 데이터는 돌아오지 않습니다.**", "Redis 클러스터 로그를 다시 보니 새벽 3시 **슬롯 마이그레이션 중 키 유실**이 기록되어 있습니다."],
        clues: {
          prompt: "TTL 변경이 왜 효과 없는지, 진짜 원인을 확인합니다.",
          options: [
            { id: "timeline", label: "📋 새벽 타임라인", content: [
              { t: "02:00", lv: "info", m: "RDB 스냅샷 저장 완료" },
              { t: "03:00", lv: "warn", m: "슬롯 리밸런싱 시작 — 키 마이그레이션 중 일부 유실" },
              { t: "03:14", lv: "error", m: "리밸런싱 완료 — 유실 키 복구 안 됨" }
            ]},
            { id: "rdb", label: "💾 RDB 스냅샷 현황", metrics: [
              { l: "마지막 RDB", v: "02:00", s: "ok", u: "유실 전 시점" },
              { l: "복구 가능 키", v: "~11,200건", s: "ok", u: "RDB 기준" },
              { l: "유실 후 신규", v: "~800건", s: "warning", u: "02:00~03:00 사이 추가분" }
            ]},
            { id: "design", label: "🏗 현재 vs 권장 설계", content: [
              { t: "", lv: "error", m: "현재: Redis ONLY → 장애 시 데이터 소실 불가피" },
              { t: "", lv: "info", m: "권장: DB 원본 + Redis 캐시 → 장애 시 DB에서 복구" }
            ]}
          ]
        },
        freeFirst: "이미 없어진 데이터의 TTL을 늘려봤자 왜 소용없는지, 그리고 **RDB 스냅샷**으로 무엇을 할 수 있는지 적어보세요.",
        slack: { name: "인프라팀 정시니어", time: "08:28", body: "TTL 문제 아니에요. 새벽 3시 **슬롯 리밸런싱 로그** 보세요. 키가 마이그레이션 중에 유실됐어요. 02:00 RDB 스냅샷은 남아있습니다." },
        timer: 20,
        q: "TTL이 아닌 진짜 원인을 파악했습니다. 어떻게 복구하시겠습니까?",
        ch: [
          { id: "A", text: "02:00 RDB 스냅샷에서 장바구니 키 복원", desc: "유실 전 시점의 백업 데이터 활용", g: "best", nx: "s7fix",
            impact: { "복구율": "~93%", "시간": "15~20분", "위험": "낮음" } },
          { id: "B", text: "고객 전원에게 쿠폰 보상 + 재등록 안내", desc: "기술 복구 포기, 보상으로 대체", g: "ok", nx: "s7fix",
            impact: { "복구율": "0%", "시간": "즉시", "비용": "쿠폰 비용" } }
        ],
        fb: {
          A: { t: "🟢 늦었지만 올바른 판단", b: "RDB 스냅샷에서 cart:* 키를 추출하여 복원하면 **02:00 시점 데이터 93%** 복구 가능.", cost: "02:00~03:00 사이 추가된 **약 800건은 복구 불가**합니다.", r: "" },
          B: { t: "🟡 비용 큼", b: "12,000명에게 쿠폰을 발급하면 **상품을 다시 담는 번거로움**에 이탈이 발생합니다.", cost: "재등록 이탈률 **30~40%** — 프로모션 매출에 직접 타격.", r: "" }
        },
        tradeoff: [
          { option: "RDB 복원", time: "15~20분", risk: "낮음", dataLoss: "~7%", note: "대부분 복구" },
          { option: "쿠폰 보상", time: "즉시", risk: "높음", dataLoss: "100%", note: "고객 이탈 위험" }
        ]
      },
      s7fix: {
        time: "08:45", title: "재발 방지 — 장바구니 아키텍처 개선", phase: "postmortem",
        nar: ["RDB 스냅샷으로 장바구니 93% 복구 완료. 프로모션은 30분 지연 시작.", "이 사고의 근본 원인은 **장바구니를 Redis에만 저장한 설계**. 어떻게 바꿔야 할까요?"],
        clues: {
          prompt: "장바구니 저장 전략을 비교합니다.",
          options: [
            { id: "dbcache", label: "📋 DB + 캐시 전략", content: [
              { t: "", lv: "info", m: "쓰기: DB 먼저 → Redis 캐시 갱신 (Write-Through)" },
              { t: "", lv: "info", m: "읽기: Redis 히트 → DB fallback" },
              { t: "", lv: "warn", m: "쓰기 레이턴시 약간 증가 (DB 왕복 추가)" }
            ]},
            { id: "aof", label: "💾 Redis AOF", content: [
              { t: "", lv: "info", m: "AOF appendfsync=everysec — 최대 1초 데이터 유실" },
              { t: "", lv: "warn", m: "AOF 파일 크기 관리 필요 — rewrite 주기 설정" },
              { t: "", lv: "error", m: "단독 Redis 의존은 여전히 SPOF" }
            ]},
            { id: "compare", label: "📊 방식 비교", metrics: [
              { l: "DB+캐시", v: "안전", s: "ok", u: "장애 시 DB fallback" },
              { l: "Redis AOF", v: "준안전", s: "warning", u: "최대 1초 유실" },
              { l: "Redis RDB만", v: "위험", s: "danger", u: "현재 — 1시간 유실" }
            ]}
          ]
        },
        freeFirst: "**'Redis에만 저장'**이 왜 위험한지 이해했다면, DB+캐시와 AOF 중 어떤 전략이 이커머스 장바구니에 더 적합한가요?",
        slack: { name: "CTO 박서연", time: "08:40", body: "복구 수고했습니다. 하지만 **장바구니를 Redis에만 저장한 설계 자체가 문제**입니다. 포스트모템에서 영구 해결안 내주세요. 프로모션 시즌마다 이러면 안 됩니다." },
        timer: 30,
        q: "장바구니 저장 전략을 어떻게 개선하시겠습니까?",
        ch: [
          { id: "A", text: "DB를 원본, Redis를 캐시로 (Write-Through)", desc: "장바구니 변경 시 DB 저장 후 Redis 갱신. 장애 시 DB fallback.", g: "best", nx: "s7a",
            impact: { "안전성": "Redis 장애에도 무손실", "성능": "읽기 동일, 쓰기 +5ms", "복잡도": "중간" } },
          { id: "B", text: "Redis AOF everysec 활성화", desc: "1초마다 디스크 기록. 최대 1초 데이터 유실.", g: "ok", nx: "s7a",
            impact: { "안전성": "최대 1초 유실", "성능": "변화 없음", "복잡도": "낮음" } },
          { id: "C", text: "클라이언트 로컬스토리지에 백업", desc: "브라우저에 장바구니 사본 저장", g: "ok", nx: "s7a",
            impact: { "안전성": "디바이스 한정", "성능": "변화 없음", "복잡도": "낮음" } }
        ],
        fb: {
          A: { t: "🟢 현업 표준 설계!", b: "**DB가 원본, Redis는 캐시**가 이커머스 장바구니의 정석입니다. Redis가 죽어도 DB에서 복구하면 됩니다.", cost: "마이그레이션 기간 동안 **기존 Redis 전용 장바구니와의 호환**을 맞춰야 합니다.", r: "쿠팡, 네이버쇼핑 등 대부분의 이커머스가 이 방식을 사용합니다." },
          B: { t: "🟡 개선이지만 부족", b: "AOF는 Redis 프로세스 장애에는 효과적이지만, **Cluster 리밸런싱 등 인프라 문제**에는 여전히 취약합니다.", cost: "AOF 파일 크기 관리와 **rewrite 부하**가 운영 부담입니다.", r: "" },
          C: { t: "🟡 보조 수단", b: "로컬스토리지는 **같은 디바이스에서만 유효**합니다. 앱↔웹 간 동기화, 로그아웃 시 유실 등 제한이 많습니다.", cost: "클라이언트 저장소 용량과 **개인정보보호 규정** 검토가 필요합니다.", r: "" }
        },
        tradeoff: [
          { option: "DB+캐시", time: "1~2주", risk: "없음", dataLoss: "없음", note: "현업 표준" },
          { option: "AOF 활성화", time: "1일", risk: "낮음", dataLoss: "최대 1초", note: "부분 개선" },
          { option: "로컬스토리지", time: "2~3일", risk: "없음", dataLoss: "디바이스 한정", note: "보조 수단" }
        ]
      },
      s7a: {
        time: "10:30", title: "재발 방지 — Redis Failover 대비", phase: "postmortem",
        nar: ["장바구니 데이터 복구와 아키텍처 개선 방향이 정해졌습니다. 이제 포스트모템에서 **Redis 장애가 다시 일어나도 서비스가 견딜 수 있는 구조**를 제안해야 합니다.", "인프라팀: '슬롯 마이그레이션은 정기적으로 합니다. 다음에도 같은 일이 생기면?'"],
        clues: {
          prompt: "Redis Failover 시 서비스 영향을 최소화하는 방법을 비교합니다.",
          options: [
            { id: "circuit", label: "📋 Redis 장애 감지", content: [
              { t: "", lv: "info", m: "Redis 연결 실패 시 서킷 브레이커 → DB fallback 자동 전환" },
              { t: "", lv: "warn", m: "fallback 시 DB 부하 증가 — 커넥션 풀 여유 필요" }
            ]},
            { id: "sync", label: "📊 DB↔Redis 동기화", metrics: [
              { l: "Write-Through 지연", v: "<5ms", s: "ok", u: "DB 먼저 Redis 갱신" },
              { l: "Redis 복구 후", v: "자동 재구축", s: "ok", u: "DB 데이터로 워밍업" }
            ]},
            { id: "test", label: "🛠 카오스 테스트", content: [
              { t: "", lv: "info", m: "Redis 노드 강제 종료 → 서비스 정상 동작 확인" },
              { t: "", lv: "warn", m: "분기 1회 Redis 장애 드릴 실시 권장" }
            ]}
          ]
        },
        freeFirst: "Redis가 죽어도 장바구니 서비스가 **정상적으로 동작하려면** 어떤 계층을 추가해야 할까요? Write-Through만으로 충분한가요?",
        slack: { name: "인프라팀 정시니어", time: "10:25", body: "Write-Through 좋습니다. 한 가지 더 — **Redis 연결이 끊겼을 때 앱이 어떻게 반응하는지** 정의해주세요. 지금은 Redis timeout이면 500 에러가 그대로 나갑니다. DB fallback이 자동으로 되게 해야 합니다." },
        q: "Redis 장애 시에도 서비스가 정상 동작하려면?",
        ch: [
          { id: "A", text: "Redis 서킷 브레이커 + DB fallback + 복구 후 자동 워밍업 + 분기별 장애 드릴", desc: "Redis 장애 감지 → 자동 DB 전환, 복구 후 캐시 재구축, 정기 검증", g: "best", nx: "end",
            impact: { "장애 시 서비스": "정상 (DB fallback)", "복구 후": "자동 워밍업", "검증": "분기별 드릴" } },
          { id: "B", text: "Redis Sentinel/Cluster HA만 강화", desc: "Redis 자체 고가용성으로 장애 방지", g: "ok", nx: "end",
            impact: { "장애 시 서비스": "잠시 중단 (failover 대기)", "복구 후": "자동", "검증": "없음" } }
        ],
        fb: {
          A: { t: "🟢 방어적 설계!", b: "**Redis가 죽어도 서비스는 살아있는 구조**. 서킷 브레이커로 Redis 장애 감지 → DB fallback. 복구 후 DB 데이터로 캐시 자동 재구축. 분기별 드릴로 실제 동작 검증.", cost: "DB fallback 시 **응답시간 증가**(5ms → 50ms)와 **DB 부하 증가**를 커넥션 풀로 대비해야 합니다.", r: "대형 커머스는 Redis 의존 서비스에 반드시 DB fallback을 구현합니다." },
          B: { t: "🟡 불완전", b: "Sentinel/Cluster가 failover하는 **수초~수십 초 동안은 서비스 중단**. 슬롯 마이그레이션 같은 계획된 작업에서도 키 유실 가능.", cost: "Redis HA만 믿으면 **이번과 같은 사고가 반복**될 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "서킷+fallback+워밍업+드릴", time: "1주", risk: "매우 낮음", dataLoss: "없음", note: "Redis 죽어도 서비스 유지" },
          { option: "HA만 강화", time: "수일", risk: "failover 중 중단", dataLoss: "가능", note: "부분적 해결" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "장바구니를 Redis에만 저장하는 설계에서 Cluster 슬롯 리밸런싱 시 키 유실 발생.",
      qa: [
        { q: "장바구니를 Redis에만 저장하면 안 되는 이유?", a: "Redis 장애(OOM, 리밸런싱, 페일오버) 시 데이터 영구 소실. DB를 원본으로, Redis를 캐시로 사용해야 합니다." },
        { q: "Redis 영속성 옵션?", a: "RDB(주기적 스냅샷), AOF(명령 로그). 둘 다 써도 '원본'은 DB가 되어야 합니다." }
      ],
      checklist: [
        "프로젝트에서 Redis에만 저장되는 데이터가 있는지 확인하세요 (장바구니, 세션, 찜 목록 등).",
        "Redis에만 있는 데이터가 있다면 DB 테이블(p_carts)을 설계하고 Write-Through 패턴을 적용하세요.",
        "Redis 장애 시 DB fallback 로직을 구현하세요: if (redis.get() == null) return db.findByUserId().",
        "Redis Cluster 운영 시 슬롯 마이그레이션 절차와 키 백업 정책을 확인하세요."
      ],
      pl: "프로젝트에서 Redis 의존 데이터를 DB+캐시 이중화로 전환하면 안정성 설계 역량 어필.",
      nextRec: [{id:"sc4",reason:"Redis 장애가 서비스 전체에 미치는 영향을 경험해보세요"},{id:"sc9",reason:"서비스 간 데이터 정합성 문제도 함께 익혀보세요"}],
      interviewQs: [
        "Redis에 중요 데이터(장바구니 등)를 저장할 때 고려해야 할 영속성 전략은 무엇인가요?",
        "Write-Through, Write-Behind, Cache-Aside 패턴의 차이점과 장바구니에 적합한 전략은?",
        "Redis Cluster 장애 시 데이터 유실을 최소화하는 방법을 설명해주세요."
      ],
      codeChallenge: {
        title: "Write-Through 장바구니 저장 구현",
        prompt: "장바구니 변경 시 DB에 먼저 저장한 후 Redis를 갱신하는 Write-Through 패턴을 구현하세요. Redis 장애 시에도 DB에서 조회할 수 있어야 합니다.",
        starterCode: "@Service\npublic class CartService {\n\n    private final CartRepository cartRepo;  // DB\n    private final RedisTemplate<String, String> redis;\n\n    public Cart addItem(Long userId, CartItem item) {\n        // 현재: Redis에만 저장 (장애 시 유실)\n        String key = \"cart:\" + userId;\n        // TODO: Write-Through 패턴 구현\n        // 1. DB에 먼저 저장 (원본)\n        // 2. Redis에 캐시 갱신\n        // 3. Redis 장애 시에도 DB fallback\n        redis.opsForHash().put(key, item.getProductId(), serialize(item));\n        return getCart(userId);\n    }\n}",
        hint: "DB 저장을 먼저 하고, Redis 갱신은 try-catch로 감싸세요. Redis 실패 시 다음 조회에서 DB 데이터를 읽어 캐시를 재구축합니다."
      }
    }
  },
  {
    id: "sc8", role: "정산 시스템 담당 개발자", brief: "월말 정산 배치를 돌렸는데 셀러 정산 합계와 주문 매출 합계가 3억 2천만 원 차이납니다. 내일이 정산일입니다.", why: "정산은 이커머스의 심장입니다. 1원이라도 틀리면 셀러 신뢰가 무너지고, 법적 분쟁이 시작됩니다. 정산 정합성을 모르면 이커머스 핵심 도메인을 다룰 수 없습니다.", title: "셀러 정산인데 매출이 3억이나 차이 나요",
    company: "마켓플러스 — 입점 셀러 2,000개 종합 마켓플레이스",
    tags: ["정산", "데이터 정합성", "이벤트 소싱"], diff: "상급", dur: "12분", cat: "데이터 정합성", icon: "💰", clr: "#ec4899",
    nodes: {
      start: {
        time: "14:00", title: "월말 정산 — 금액 불일치", phase: "investigate",
        nar: ["월말 정산 배치 실행 완료. **셀러 정산 합계: 47억 8천만 원.** **주문 매출 합계: 51억 원.**", "**3억 2천만 원 차이.** 150개 셀러의 정산이 보류 상태입니다. 내일이 정산일.", "재무팀에서 긴급 연락이 왔습니다."],
        clues: {
          prompt: "3억 2천만 원 차이의 원인을 추적하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "diff", label: "📋 불일치 상세 분석", content: [
              { t: "", lv: "error", m: "부분 환불 미반영: 1,847건 — 차이 약 2억 1천만 원" },
              { t: "", lv: "warn", m: "쿠폰 할인 정산 오류: 342건 — 차이 약 8천만 원" },
              { t: "", lv: "warn", m: "수수료 계산 소수점 절사 누적: 약 3천만 원" }
            ]},
            { id: "flow", label: "🏗 정산 파이프라인", content: [
              { t: "", lv: "info", m: "주문 서비스 → Kafka → 정산 서비스 (이벤트 기반)" },
              { t: "", lv: "error", m: "환불 서비스 → 정산 서비스: **HTTP 동기 호출 (이벤트 아님)**" },
              { t: "", lv: "warn", m: "환불 이벤트가 정산에 비동기 전달되지 않아 **부분 환불 누락**" }
            ]},
            { id: "metric", label: "📊 정산 현황", metrics: [
              { l: "불일치 금액", v: "3.2억", s: "danger", u: "주문 대비" },
              { l: "보류 셀러", v: "150개", s: "danger", u: "전체 2,000개 중" },
              { l: "정산일까지", v: "D-1", s: "danger", u: "내일 오전" }
            ]}
          ]
        },
        timer: 45,
        freeFirst: "3억 2천만 원의 차이가 어디서 발생했을까요? 주문→정산 파이프라인에서 **어떤 이벤트가 누락**되면 이런 차이가 생기는지 추론해보세요.",
        q: "정산 불일치의 주요 원인은?",
        hint: "주문은 Kafka 이벤트로 정산에 전달되는데, 환불은 어떻게 전달되고 있나요?",
        ch: [
          { id: "A", text: "부분 환불 이벤트가 정산 서비스에 전달되지 않았다", desc: "환불은 HTTP 동기 호출이라 정산에 비동기 전달 안 됨", g: "best", nx: "s8fix",
            impact: { "원인": "2.1억 (66%)", "해결": "이벤트 파이프라인 통합" } },
          { id: "B", text: "DB 트랜잭션 롤백으로 일부 주문 누락", desc: "주문 자체가 유실됐다", g: "bad", nx: "s8_bad",
            impact: { "원인": "잘못된 방향", "해결": "시간 낭비" } },
          { id: "C", text: "수수료 계산 로직의 소수점 처리 오류", desc: "반올림 누적 차이", g: "ok", nx: "s8fix",
            impact: { "원인": "0.3억 (9%)", "해결": "일부만 설명" } }
        ],
        fb: {
          A: { t: "🟢 핵심을 짚었습니다!", b: "주문은 Kafka 이벤트로 정산에 전달되지만, **부분 환불은 HTTP 동기 호출**로만 처리되어 정산 서비스에 **반영되지 않았습니다.**", cost: "이미 잘못 정산된 **이전 달 데이터**도 소급 점검이 필요할 수 있습니다.", r: "배달의민족, 쿠팡 등은 모든 금전 이벤트(주문, 환불, 쿠폰)를 동일 이벤트 파이프라인으로 처리합니다." },
          B: { t: "🔴 방향 오류", b: "주문 자체는 정상 저장되어 있습니다. 문제는 **주문 이후의 환불/할인 이벤트가 정산에 전달되지 않은 것**입니다.", cost: "트랜잭션 로그 추적에 **시간을 낭비**하면 정산일을 넘길 수 있습니다.", r: "" },
          C: { t: "🟡 원인 중 하나지만 일부", b: "소수점 절사 차이는 **3천만 원(9%)**만 설명합니다. 나머지 **2.9억 원**의 원인을 더 찾아야 합니다.", cost: "부분 원인에만 집중하면 **전체 불일치의 91%**를 놓칩니다.", r: "" }
        },
        tradeoff: [
          { option: "환불 이벤트 추적", time: "15분", risk: "없음", dataLoss: "없음", note: "66% 원인 설명" },
          { option: "DB 트랜잭션 확인", time: "30분", risk: "없음", dataLoss: "없음", note: "관련 없는 방향" },
          { option: "수수료 로직 검증", time: "20분", risk: "없음", dataLoss: "없음", note: "9%만 설명" }
        ]
      },
      s8_bad: {
        time: "14:30", title: "트랜잭션 추적 — 시간 낭비", phase: "action",
        nar: ["DB 트랜잭션 로그를 30분간 추적했지만 **주문 유실은 없었습니다.**", "정산 서비스 로그를 다시 보니 **부분 환불 이벤트가 하나도 수신되지 않은 것**을 발견했습니다."],
        clues: {
          prompt: "30분을 허비한 뒤, 진짜 원인에 접근합니다.",
          options: [
            { id: "refund", label: "📋 환불 서비스 호출 로그", content: [
              { t: "14:28", lv: "error", m: "정산 서비스 수신 환불 이벤트: 0건 (이번 달)" },
              { t: "14:28", lv: "warn", m: "환불 서비스 → 정산: HTTP POST /api/settlement/refund (동기)" },
              { t: "14:29", lv: "error", m: "이 API가 **정산 배치에 반영되지 않음** — 별도 테이블에 기록" }
            ]},
            { id: "time", label: "⏱ 남은 시간", metrics: [
              { l: "정산일까지", v: "18시간", s: "danger", u: "내일 오전 9시" },
              { l: "허비한 시간", v: "30분", s: "warning", u: "트랜잭션 추적" }
            ]},
            { id: "scope", label: "📊 불일치 분해", content: [
              { t: "", lv: "error", m: "부분 환불 미반영: 2.1억 (66%)" },
              { t: "", lv: "warn", m: "쿠폰 할인: 0.8억 (25%)" },
              { t: "", lv: "warn", m: "소수점 절사: 0.3억 (9%)" }
            ]}
          ]
        },
        freeFirst: "부분 환불이 정산에 반영되지 않은 구조적 이유가 뭘까요? **주문은 Kafka인데 환불은 HTTP**인 것이 왜 문제인지 적어보세요.",
        slack: { name: "재무팀 김팀장", time: "14:25", body: "아직 원인 못 찾으셨어요? 내일 **150개 셀러에게 정산금을 입금**해야 합니다. 금액이 틀리면 **계약 위반**이에요." },
        timer: 20,
        q: "진짜 원인을 파악했습니다. 어떻게 보정하시겠습니까?",
        ch: [
          { id: "A", text: "환불 데이터를 추출하여 정산 이벤트로 재처리(replay)", desc: "환불 테이블에서 이번 달 데이터 추출 후 정산 파이프라인에 주입", g: "best", nx: "s8fix",
            impact: { "정확도": "99%+", "시간": "2~3시간", "위험": "낮음" } },
          { id: "B", text: "SQL로 정산 테이블 직접 UPDATE", desc: "정산 금액을 수동으로 보정", g: "ok", nx: "s8fix",
            impact: { "정확도": "불확실", "시간": "1시간", "위험": "2차 불일치" } }
        ],
        fb: {
          A: { t: "🟢 안전한 보정", b: "환불 원본 데이터를 정산 파이프라인에 **재처리(replay)**하면 정상 정산 로직을 거치므로 정확합니다.", cost: "30분을 허비했지만, **replay 방식은 검증된 안전한 접근**입니다.", r: "" },
          B: { t: "🟡 위험한 지름길", b: "수동 SQL은 빠르지만 **검증 절차 없이 금액을 변경**하므로 2차 불일치 위험이 큽니다.", cost: "잘못된 UPDATE가 **다른 셀러 정산까지 영향**을 줄 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "이벤트 replay", time: "2~3시간", risk: "낮음", dataLoss: "없음", note: "정상 로직 경유" },
          { option: "SQL 직접 보정", time: "1시간", risk: "높음", dataLoss: "2차 불일치 가능", note: "위험한 지름길" }
        ]
      },
      s8fix: {
        time: "15:00", title: "긴급 보정 — 정산 데이터 복구", phase: "action",
        nar: ["원인 파악 완료: 부분 환불(2.1억) + 쿠폰 할인 오류(0.8억) + 소수점 절사(0.3억) = **3.2억.**", "내일 정산일까지 보정을 완료해야 합니다."],
        clues: {
          prompt: "보정 방식의 안전성을 비교합니다.",
          options: [
            { id: "replay", label: "📋 이벤트 replay", content: [
              { t: "", lv: "info", m: "환불 테이블에서 1,847건 추출 → Kafka 이벤트로 변환 → 정산 서비스 재처리" },
              { t: "", lv: "warn", m: "멱등 처리 확인 필요 — 중복 반영 방지 (idempotency key)" }
            ]},
            { id: "sql", label: "🗃 SQL 직접 보정", content: [
              { t: "", lv: "warn", m: "UPDATE settlement SET amount = amount - refund_amount WHERE ..." },
              { t: "", lv: "error", m: "1,847건 + 342건 = 2,189건 수동 계산 — 실수 가능성 높음" }
            ]},
            { id: "verify", label: "✅ 검증 방법", content: [
              { t: "", lv: "info", m: "보정 전후 diff → 재무팀 검수 → 셀러 샘플 검증" },
              { t: "", lv: "warn", m: "시간 제약: 내일 오전 9시까지 완료 필수" }
            ]}
          ]
        },
        freeFirst: "2,189건을 보정할 때 **replay와 SQL 직접 수정** 중 어떤 방식이 더 안전한가요? 그 이유를 적어보세요.",
        slack: { name: "CTO 박서연", time: "14:55", body: "원인 파악 수고했습니다. **내일 정산은 반드시 맞춰야 합니다.** 보정 방식은 신중하게 선택해주세요. SQL로 직접 만지다가 더 꼬이면 안 됩니다." },
        timer: 30,
        q: "어떤 방식으로 정산 데이터를 보정하시겠습니까?",
        ch: [
          { id: "A", text: "환불·쿠폰 이벤트를 정산 파이프라인에 replay", desc: "원본 데이터를 정상 정산 로직으로 재처리 (멱등 보장)", g: "best", nx: "s8fix2",
            impact: { "정확도": "99%+", "시간": "2~3시간", "안전성": "정상 로직 경유" } },
          { id: "B", text: "SQL 스크립트로 정산 테이블 직접 보정", desc: "차이 금액을 계산하여 UPDATE", g: "ok", nx: "s8fix2",
            impact: { "정확도": "수작업 의존", "시간": "1시간", "안전성": "2차 오류 가능" } }
        ],
        fb: {
          A: { t: "🟢 안전한 선택!", b: "**이벤트 replay**는 정상 정산 로직(수수료 계산, 할인 적용 등)을 그대로 거치므로 일관성이 보장됩니다. 멱등키로 중복 처리도 방지.", cost: "replay 스크립트 작성과 **스테이징 검증**에 시간이 걸립니다.", r: "현업에서 정산 보정은 항상 '원본 이벤트 재처리' 방식을 권장합니다." },
          B: { t: "🟡 빠르지만 위험", b: "SQL 직접 보정은 **정산 로직(수수료, 할인, 세금)을 우회**하므로 계산 오류 가능성이 있습니다.", cost: "2차 불일치 발생 시 **신뢰도가 완전히 무너져** 전수 감사가 필요할 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "이벤트 replay", time: "2~3시간", risk: "낮음", dataLoss: "없음", note: "정산 로직 경유" },
          { option: "SQL 직접 보정", time: "1시간", risk: "높음", dataLoss: "없음", note: "로직 우회" }
        ]
      },
      s8fix2: {
        time: "다음 날", title: "재발 방지 — 정산 아키텍처 개선", phase: "postmortem",
        nar: ["정산 보정 완료. 150개 셀러 정산 정상 처리.", "근본 원인은 **환불 이벤트가 정산 파이프라인을 타지 않는 구조**. 어떻게 개선할까요?"],
        clues: {
          prompt: "정산 아키텍처 개선 방향을 비교합니다.",
          options: [
            { id: "event", label: "📋 이벤트 통합", content: [
              { t: "", lv: "info", m: "모든 금전 이벤트(주문, 환불, 쿠폰, 포인트)를 **동일 Kafka 토픽**으로" },
              { t: "", lv: "info", m: "정산 서비스가 단일 소비자로 **모든 이벤트를 순서대로 처리**" }
            ]},
            { id: "ledger", label: "📒 이중 원장", content: [
              { t: "", lv: "info", m: "Double-entry ledger: 모든 거래를 **차변/대변 쌍**으로 기록" },
              { t: "", lv: "warn", m: "차변 합계 = 대변 합계 → 항상 균형 검증 가능" }
            ]},
            { id: "daily", label: "⏰ 일일 정합성 체크", content: [
              { t: "", lv: "info", m: "매일 주문 합계 vs 정산 합계 diff 체크 → 불일치 시 알림" },
              { t: "", lv: "warn", m: "월말이 아니라 **매일** 확인하면 차이를 조기 발견" }
            ]}
          ]
        },
        freeFirst: "정산 보정 후 입점 셀러 150곳에 보낼 **공지 메시지**를 작성해보세요. 불일치 원인, 보정 완료 사실, 재발 방지 대책을 포함해야 하며, 셀러 신뢰를 유지하는 톤이어야 합니다.",
        slack: { name: "재무팀 김팀장", time: "익일 09:30", body: "정산 정상 처리 확인했습니다. 수고하셨어요. 하지만 **다시는 이런 일 없도록** 시스템적 방지 장치를 마련해주세요. 셀러 신뢰가 생명입니다." },
        q: "정산 시스템을 어떻게 개선하시겠습니까?",
        ch: [
          { id: "A", text: "모든 금전 이벤트를 Kafka 통합 + 이중 원장 + 일일 정합성 체크", desc: "이벤트 파이프라인 단일화, 복식부기 원장, 매일 diff 검증", g: "best", nx: "end",
            impact: { "불일치 방지": "구조적 보장", "감지": "일일", "비용": "구축 2~3주" } },
          { id: "B", text: "환불 이벤트만 Kafka로 전환", desc: "이번에 문제된 부분만 수정", g: "ok", nx: "end",
            impact: { "불일치 방지": "환불만", "감지": "월말", "비용": "구축 3~5일" } }
        ],
        fb: {
          A: { t: "🟢 시니어급 설계!", b: "**이벤트 통합 + 이중 원장 + 일일 체크** 3종 세트. 금전 관련 모든 이벤트를 단일 파이프라인으로 처리하고, 복식부기로 항상 균형 검증.", cost: "구축 기간 2~3주와 **기존 동기 API 마이그레이션** 작업이 필요합니다.", r: "배달의민족, 토스 등은 이중 원장과 이벤트 소싱을 정산 시스템의 기반으로 사용합니다." },
          B: { t: "🟡 부분적 개선", b: "환불 문제는 해결되지만, **쿠폰·포인트·적립금** 등 다른 금전 이벤트에서 같은 문제가 반복될 수 있습니다.", cost: "다음 달에 **다른 이유로 또 불일치**가 발생할 위험이 남습니다.", r: "" }
        }
      },
      end: { type: "end" }
    },
    pm: {
      rc: "부분 환불 이벤트가 정산 파이프라인(Kafka)을 타지 않고 HTTP 동기 호출로만 처리되어 정산에 미반영.",
      qa: [
        { q: "정산 정합성을 보장하려면?", a: "모든 금전 이벤트(주문, 환불, 쿠폰)를 동일 이벤트 파이프라인으로 처리. 이중 원장(double-entry ledger)으로 차변=대변 항상 검증." },
        { q: "정산 불일치 발생 시 보정 방법?", a: "SQL 직접 수정보다 원본 이벤트 replay가 안전. 정산 로직(수수료, 할인)을 정상 경유." }
      ],
      checklist: [
        "프로젝트에서 주문/환불/쿠폰 등 금전 이벤트가 모두 같은 파이프라인을 타는지 확인하세요.",
        "정산 테이블에 차변/대변 컬럼을 추가하고, SUM(debit) = SUM(credit)인지 검증 쿼리를 만들어보세요.",
        "매일 주문 합계 vs 정산 합계를 비교하는 배치 스크립트를 작성하고, 차이 발생 시 Slack 알림을 보내세요.",
        "환불/취소 API가 정산 서비스에 이벤트를 발행하는지, 아니면 동기 호출만 하는지 확인하세요."
      ],
      pl: "정산 시스템에 이중 원장과 일일 정합성 체크를 도입하면 금융/이커머스 핵심 역량 어필.",
      nextRec: [{id:"sc2",reason:"결제 멱등성도 정산 정합성과 직결됩니다"},{id:"sc9",reason:"MSA에서 서비스 간 정합성을 SAGA로 보장하는 법을 익혀보세요"}],
      interviewQs: [
        "이커머스 정산 시스템에서 데이터 정합성을 보장하는 방법을 설명해주세요.",
        "이벤트 소싱과 이중 원장(Double-Entry Ledger) 패턴은 각각 무엇이고, 정산에 어떻게 도움이 되나요?",
        "정산 금액 불일치가 발생했을 때 SQL 직접 수정 대신 이벤트 replay를 권장하는 이유는?"
      ],
      codeChallenge: {
        title: "일일 정산 정합성 검증 쿼리 작성",
        prompt: "주문 매출 합계와 셀러 정산 합계를 비교하여 불일치를 감지하는 일일 정합성 검증 쿼리를 작성하세요. 환불, 쿠폰 할인, 수수료를 모두 고려해야 합니다.",
        starterCode: "-- 일일 정산 정합성 검증 쿼리\n-- TODO: 주문 매출 합계 vs 정산 합계 비교\n\n-- 1. 주문 매출 합계 (환불 차감)\nSELECT\n    -- TODO: 주문 금액 - 환불 금액 - 쿠폰 할인\n    NULL AS order_total\nFROM orders o\nWHERE o.created_at >= CURRENT_DATE - INTERVAL '1 day';\n\n-- 2. 셀러 정산 합계\nSELECT\n    -- TODO: 정산 금액 합계\n    NULL AS settlement_total\nFROM settlements s\nWHERE s.settlement_date = CURRENT_DATE;\n\n-- 3. 차이 검출\n-- TODO: 두 합계의 차이가 0이 아니면 알림",
        hint: "LEFT JOIN으로 환불/쿠폰 테이블을 결합하고, COALESCE로 NULL 처리하세요. 차이 금액의 절대값이 임계치를 넘으면 알림을 보냅니다."
      }
    }
  },
  {
    id: "sc9", role: "MSA 백엔드 개발자", brief: "고객의 카드에서 돈은 빠졌는데 주문 내역에 없습니다. 결제와 주문이 다른 DB를 사용하기 때문입니다.", why: "MSA로 전환한 이커머스에서 반드시 마주하는 문제입니다. '결제됐는데 주문이 없다'는 CS가 들어오면, SAGA를 모르는 개발자는 패닉에 빠집니다.", title: "결제는 됐는데 주문이 안 만들어졌다",
    company: "원커머스 — MSA 전환 중인 일 주문 15만 건 종합 커머스",
    tags: ["분산 트랜잭션", "SAGA 패턴", "MSA"], diff: "상급", dur: "12분", cat: "설계 이슈", icon: "🔗", clr: "#7c3aed",
    nodes: {
      start: {
        time: "14:00", title: "결제-주문 정합성 불일치", phase: "investigate",
        nar: ["고객 CS: 카드에서 돈은 빠졌는데 **주문 내역에 없어요**.", "확인: 결제 서비스 SUCCESS, 주문 서비스 DB 에러로 주문 미생성.", "MSA에서 결제/주문은 **별도 DB**. @Transactional로 묶을 수 없음."],
        clues: {
          prompt: "데이터 불일치 원인을 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "payment", label: "💳 결제 서비스 로그", content: [
              { t: "14:00:01", lv: "info", m: "payment-service: Payment SUCCESS, id=PAY-8821, amount=89000" },
              { t: "14:00:01", lv: "info", m: "payment-service: PG API called, transaction confirmed" }
            ]},
            { id: "order", label: "📦 주문 서비스 로그", content: [
              { t: "14:00:02", lv: "error", m: "order-service: DataIntegrityViolationException - constraint violation" },
              { t: "14:00:02", lv: "error", m: "order-service: Order creation FAILED for payment PAY-8821" },
              { t: "14:00:02", lv: "warn", m: "payment-service: No rollback triggered! Payment still SUCCESS" }
            ]},
            { id: "arch", label: "🏗 아키텍처 다이어그램", content: [
              { t: "", lv: "info", m: "Client -> API Gateway -> order-service (DB1)" },
              { t: "", lv: "info", m: "order-service -> FeignClient -> payment-service (DB2)" },
              { t: "", lv: "error", m: "order-service와 payment-service는 별도 DB!" },
              { t: "", lv: "error", m: "@Transactional은 단일 DB에서만 동작!" }
            ]}
          ]
        },
        timer: 45,
        freeFirst: "MSA에서 서로 다른 DB를 사용하는 서비스 간에 데이터 정합성을 어떻게 보장할 수 있을까요? @Transactional을 쓸 수 없다면?",
        q: "MSA에서 이 정합성 문제를 어떻게 해결해야 하나요?",
        hint: "하나의 DB 트랜잭션으로 여러 서비스를 묶을 수 없습니다. 다른 방법이 필요합니다.",
        ch: [
          { id: "A", text: "SAGA 패턴 — 실패 시 보상 트랜잭션으로 결제 취소", desc: "각 서비스 로컬 트랜잭션, 실패 시 이전 단계 되돌리기", g: "best", nx: "s9i",
            impact: { "정합성": "보장 (보상 트랜잭션)", "복잡도": "중간", "성능": "좋음" } },
          { id: "B", text: "2PC(Two-Phase Commit)", desc: "코디네이터가 전체 관리", g: "bad", nx: "s9_bad",
            impact: { "정합성": "보장", "복잡도": "매우 높음", "성능": "병목" } },
          { id: "C", text: "결제+주문을 같은 서비스로 합침", desc: "하나의 트랜잭션으로", g: "ok", nx: "s9i",
            impact: { "정합성": "보장", "복잡도": "낮음", "확장성": "포기" } }
        ],
        fb: {
          A: { t: "🟢 MSA 분산 트랜잭션 표준!", b: "**SAGA**: 주문 생성, 결제, (성공)확정 / (실패)취소. 실패 시 **보상 트랜잭션**. Choreography 또는 Orchestration.", cost: "보상·재시도·이벤트 순서 설계로 **운영 복잡도**가 올라갑니다.", r: "쿠팡, 배달의민족 등 대규모 MSA에서 필수." },
          B: { t: "🟡 현실적 어려움", b: "2PC는 성능 병목, 단일 장애점, 복잡성으로 MSA에서 거의 미사용.", cost: "코디네이터가 병목·SPOF가 되어 **트래픽 급증 시** 전체가 멈출 수 있습니다.", r: "" },
          C: { t: "🟡 MSA 장점 포기", b: "합치면 독립 배포/확장 장점 상실.", cost: "팀·배포 단위가 커지고 **결제·주문이 한 덩어리**로 묶여 확장이 어려워집니다.", r: "" }
        },
        tradeoff: [
          { option: "SAGA 패턴", time: "1~2주", risk: "낮음", dataLoss: "보상으로 복구", note: "MSA 표준" },
          { option: "2PC", time: "2~4주", risk: "높음 (병목)", dataLoss: "없음", note: "거의 미사용" },
          { option: "서비스 합치기", time: "3~5일", risk: "없음", dataLoss: "없음", note: "MSA 장점 상실" }
        ]
      },
      s9_bad: {
        time: "14:30", title: "2PC 도입 시도 — 성능 병목", phase: "action",
        nar: ["2PC(Two-Phase Commit)를 구현하기 시작했습니다. 코디네이터를 만들고 prepare/commit 프로토콜을 적용.", "그런데 **피크 시간 주문 처리량이 40% 급감**하고, 코디네이터가 타임아웃 나면 **양쪽 서비스 모두 블로킹**되는 현상이 발생합니다."],
        clues: {
          prompt: "2PC가 왜 MSA에 맞지 않는지 확인합니다.",
          options: [
            { id: "perf", label: "📊 성능 비교", metrics: [
              { l: "2PC 전", v: "1,200 TPS", s: "ok", u: "주문 처리량" },
              { l: "2PC 후", v: "720 TPS", s: "danger", u: "40% 감소" },
              { l: "코디네이터 타임아웃", v: "12건/시간", s: "warning", u: "양쪽 블로킹" }
            ]},
            { id: "block", label: "📋 블로킹 로그", content: [
              { t: "14:25", lv: "error", m: "2PC Coordinator: prepare timeout for order-service — payment-service LOCKED 30s" },
              { t: "14:26", lv: "warn", m: "payment-service: 30초간 다른 결제도 블로킹 — 전체 결제 지연" }
            ]},
            { id: "arch2", label: "🏗 2PC vs SAGA", content: [
              { t: "", lv: "error", m: "2PC: 모든 참여자가 prepare → 코디네이터 commit — 한 곳 느리면 전체 멈춤" },
              { t: "", lv: "info", m: "SAGA: 각 서비스 독립 커밋, 실패 시 보상 — 블로킹 없음" }
            ]}
          ]
        },
        freeFirst: "2PC에서 **한 서비스가 느려지면** 다른 서비스까지 블로킹되는 이유를 적어보세요. SAGA와 무엇이 다른가요?",
        slack: { name: "DBA 한시니어", time: "14:28", body: "2PC 넣은 뒤로 **결제 락 대기**가 심해졌어요. prepare 단계에서 트랜잭션 걸려있는 동안 다른 결제도 못 들어가요. 피크에 이러면 안 됩니다." },
        timer: 20,
        q: "2PC가 MSA에 부적합한 이유를 체감했습니다. 어떻게 전환하시겠습니까?",
        ch: [
          { id: "A", text: "2PC 제거, SAGA 패턴으로 전환", desc: "각 서비스 독립 커밋 + 실패 시 보상 트랜잭션", g: "best", nx: "s9i",
            impact: { "블로킹": "제거", "TPS": "1,200 복구", "정합성": "보상으로 보장" } },
          { id: "B", text: "2PC 유지하되 타임아웃 줄임", desc: "코디네이터 타임아웃 30s → 5s", g: "ok", nx: "s9i",
            impact: { "블로킹": "감소", "TPS": "부분 복구", "정합성": "타임아웃 시 불확실" } }
        ],
        fb: {
          A: { t: "🟢 올바른 결론", b: "2PC의 핵심 문제는 **동기 블로킹**입니다. MSA에서 서비스가 독립적으로 스케일해야 하는데, 2PC는 가장 느린 서비스에 전체가 묶입니다.", cost: "2PC 코드 제거와 **SAGA 재설계**에 추가 시간이 들었습니다.", r: "" },
          B: { t: "🟡 미봉책", b: "타임아웃을 줄이면 블로킹은 짧아지지만, **타임아웃 발생 시 양쪽 상태가 불확실**해집니다.", cost: "prepare 성공 후 commit 전에 타임아웃 나면 **한쪽만 커밋된 반절짜리 상태**가 됩니다.", r: "" }
        },
        tradeoff: [
          { option: "SAGA 전환", time: "1~2주", risk: "낮음", dataLoss: "보상으로 복구", note: "블로킹 제거" },
          { option: "2PC 타임아웃 조정", time: "즉시", risk: "높음", dataLoss: "불확실 상태", note: "근본 해결 안됨" }
        ]
      },
      s9i: {
        time: "15:00", title: "SAGA 구현 방식 선택", phase: "action",
        nar: ["SAGA 패턴으로 방향이 잡혔습니다. 이제 구현 방식을 결정해야 합니다.", "현재 CS 42건이 쌓여 있고, 결제팀과 주문팀이 각각 독립 배포 중입니다. **결제처럼 감사 추적이 필요한 핵심 플로우**에 어떤 방식이 맞을까요?"],
        clues: {
          prompt: "구현 방식의 운영·조직 영향을 확인합니다.",
          options: [
            { id: "orch", label: "🎛 Orchestration", content: [
              { t: "", lv: "info", m: "중앙 Orchestrator — 타임아웃·재시도·보상 한곳에서 관리" },
              { t: "", lv: "info", m: "흐름: Orchestrator → 주문 생성 → 결제 요청 → (성공)확정 / (실패)보상" },
              { t: "", lv: "warn", m: "Orchestrator **SPOF** — HA 설계 필요" }
            ]},
            { id: "chor", label: "📨 Choreography", content: [
              { t: "", lv: "info", m: "이벤트만으로 느슨한 결합: OrderCreated → PaymentRequested → PaymentCompleted → OrderConfirmed" },
              { t: "", lv: "error", m: "분산 추적·디버깅 어려움 — 서비스 3개 이상이면 **이벤트 스파게티**" }
            ]},
            { id: "pay", label: "💳 결제 도메인 요구사항", metrics: [
              { l: "감사 추적", v: "필수", s: "danger", u: "금융 규제·정산" },
              { l: "CS 대응", v: "빈번", s: "warning", u: "주문 상태 즉시 확인" },
              { l: "권장", v: "Orchestration", s: "ok", u: "핵심 플로우" }
            ]}
          ]
        },
        freeFirst: "결제·주문이 흩어진 MSA에서, **한눈에 플로우를 보여줘야 하는 사람**은 누구인가요? CS가 '이 주문 지금 어디쯤이에요?'라고 물으면 어디를 보면 되나요?",
        slack: { name: "결제팀 박시니어", time: "14:50", body: "SAGA 도입 찬성합니다. 다만 **Choreography로 하면 이벤트 흐름 추적이 어렵습니다.** CS에서 '결제됐는데 주문 없다'고 하면 **어떤 이벤트가 빠졌는지** 한눈에 봐야 하잖아요. 결제처럼 중요한 플로우는 Orchestration을 추천합니다." },
        timer: 30,
        q: "Choreography vs Orchestration?",
        ch: [
          { id: "A", text: "Orchestration — 중앙 Saga Orchestrator", desc: "흐름 한 곳 관리, 디버깅 용이, 감사 추적 쉬움", g: "best", nx: "s9comp",
            impact: { "흐름 파악": "쉬움 (한 곳)", "디버깅": "용이", "결합도": "중간" } },
          { id: "B", text: "Choreography — 이벤트 발행/구독", desc: "느슨한 결합, 유연한 확장", g: "ok", nx: "s9comp",
            impact: { "흐름 파악": "어려움 (분산)", "디버깅": "어려움", "결합도": "매우 낮음" } }
        ],
        fb: {
          A: { t: "🟢 관리 용이!", b: "**Orchestration**: 흐름 한 곳. 디버깅/모니터링 쉬움. 복잡한 비즈니스에 적합. CS가 '이 주문 상태가 뭐예요?'라고 하면 Orchestrator 로그 한 곳만 보면 됩니다.", cost: "Orchestrator 팀이 **장애 책임**을 지는 구조가 되므로 조직 합의가 필요합니다.", r: "결제 같은 핵심 플로우는 Orchestration 선호." },
          B: { t: "🟡 느슨한 결합", b: "결합 낮고 확장 유연. 하지만 전체 흐름 파악 어렵고 디버깅 어려움. 서비스가 3개 이상이면 이벤트 체인이 복잡해집니다.", cost: "**이벤트 버전 호환**·데드 레터 큐 운영 비용이 큽니다.", r: "" }
        },
        tradeoff: [
          { option: "Orchestration", time: "1~2주", risk: "Orchestrator 장애", dataLoss: "없음", note: "핵심 플로우에 적합" },
          { option: "Choreography", time: "1~2주", risk: "이벤트 유실", dataLoss: "가능", note: "단순한 플로우에 적합" }
        ]
      },
      s9comp: {
        time: "16:00", title: "보상 트랜잭션 설계", phase: "postmortem",
        nar: ["Orchestration 방식으로 SAGA를 구현합니다. 가장 중요한 부분은 **보상 트랜잭션(Compensating Transaction)**.", "지금 당장 해결해야 할 것: 결제는 됐는데 주문이 없는 **PAY-8821 고객**. 그리고 앞으로 같은 상황에서 **자동으로 결제를 취소하는 보상 로직**."],
        clues: {
          prompt: "보상 트랜잭션 설계 시 고려할 점을 확인합니다.",
          options: [
            { id: "comp", label: "📋 보상 트랜잭션 흐름", content: [
              { t: "", lv: "info", m: "정상: 주문 생성 → 결제 요청 → 결제 성공 → 주문 확정" },
              { t: "", lv: "error", m: "실패: 주문 생성 → 결제 요청 → 결제 성공 → 주문 확정 실패" },
              { t: "", lv: "warn", m: "보상: → 결제 취소 API 호출 → PG 환불 → 고객 알림" }
            ]},
            { id: "edge", label: "⚠ 엣지 케이스", content: [
              { t: "", lv: "error", m: "보상 자체가 실패하면? — PG 취소 API 타임아웃" },
              { t: "", lv: "warn", m: "재시도 + Dead Letter Queue + 수동 처리 플로우 필요" },
              { t: "", lv: "info", m: "멱등키로 중복 취소 방지 필수" }
            ]},
            { id: "monitor", label: "📊 운영 지표", metrics: [
              { l: "보상 성공률", v: "목표 99.9%", s: "ok", u: "SLO" },
              { l: "DLQ 건수", v: "0 목표", s: "ok", u: "수동 처리 대상" },
              { l: "보상 지연", v: "<3초", s: "ok", u: "고객 체감" }
            ]}
          ]
        },
        freeFirst: "보상 트랜잭션(결제 취소)이 **실패**하면 어떻게 되나요? 재시도만으로 충분한가요? 그 한계는 무엇인가요?",
        slack: { name: "PG연동 김개발", time: "15:50", body: "보상 로직 중요한 포인트 하나요. PG 취소 API가 **타임아웃**나면 취소가 된 건지 안 된 건지 모릅니다. **멱등키 + 상태 확인 API**를 같이 써야 해요. 안 그러면 이중 환불이 날 수 있습니다." },
        timer: 30,
        q: "보상 트랜잭션 실패까지 고려한 설계는?",
        ch: [
          { id: "A", text: "보상 재시도 + DLQ + 멱등키 + 수동 처리 대시보드", desc: "자동 재시도 3회, 실패 시 DLQ, 멱등키로 중복 방지, 운영자 대시보드", g: "best", nx: "end",
            impact: { "자동 복구": "99.9%", "수동 처리": "0.1% (DLQ)", "이중 환불": "멱등키로 방지" } },
          { id: "B", text: "보상 재시도만 구현 (3회 → 실패 로그)", desc: "재시도 후 실패하면 로그만 남김", g: "ok", nx: "end",
            impact: { "자동 복구": "95%", "수동 처리": "로그 수동 확인", "이중 환불": "방지 안 됨" } }
        ],
        fb: {
          A: { t: "🟢 프로덕션 레디 설계!", b: "**재시도 + DLQ + 멱등키 + 대시보드** 4종 세트. 보상이 실패해도 DLQ에 쌓이고, 운영자가 대시보드에서 수동 처리. 멱등키로 재시도 시 이중 환불 방지.", cost: "DLQ 소비자·대시보드·알림 구축에 **추가 1주**가 필요합니다.", r: "토스, 배달의민족 등은 보상 실패를 DLQ+운영 대시보드로 관리합니다." },
          B: { t: "🟡 불완전", b: "재시도 3회로 95%는 커버하지만, **나머지 5%는 로그를 사람이 뒤져야** 합니다. 멱등키 없이 재시도하면 **이중 환불** 위험.", cost: "PG에서 **이중 환불 정산 차이**가 나면 월말에 재무팀과 싸워야 합니다.", r: "" }
        },
        tradeoff: [
          { option: "재시도+DLQ+멱등키+대시보드", time: "2주", risk: "매우 낮음", dataLoss: "없음", note: "현업 표준" },
          { option: "재시도+로그만", time: "3일", risk: "이중 환불", dataLoss: "5% 수동 처리", note: "MVP 수준" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "MSA에서 결제/주문 별도 DB, 한쪽 실패 시 보상 트랜잭션 부재로 데이터 불일치.",
      qa: [
        { q: "SAGA 패턴이란?", a: "MSA 분산 트랜잭션 패턴. 각 서비스 로컬 트랜잭션, 실패 시 보상 트랜잭션으로 되돌림." },
        { q: "Orchestration vs Choreography?", a: "Orchestration: 중앙 관리, 디버깅 용이. Choreography: 이벤트 기반, 느슨한 결합. 결제 같은 핵심 플로우는 Orchestration 권장." },
        { q: "보상 트랜잭션 실패 시?", a: "재시도 + Dead Letter Queue + 멱등키. DLQ에 쌓인 건은 운영 대시보드에서 수동 처리." }
      ],
      checklist: [
        "프로젝트에서 주문 생성 시 결제/배송/알림이 함께 호출되나요? 하나가 실패하면 나머지는 어떻게 되나요?",
        "FeignClient 호출이 실패했을 때 **보상 로직(결제 취소 등)**이 구현되어 있는지 확인하세요. 없다면 try-catch에 보상 메서드를 추가해보세요.",
        "보상 트랜잭션에 **멱등키**를 적용했는지 확인하세요. 같은 취소 요청이 2번 가도 1번만 실행되어야 합니다.",
        "보상 실패 건을 담는 **Dead Letter Queue(DLQ)**를 설계하고, DLQ 건수가 0이 아닐 때 Slack 알림을 보내보세요."
      ],
      pl: "물류 프로젝트 주문+배송 생성에 SAGA 패턴 + 보상 트랜잭션 적용 어필.",
      nextRec: [{id:"sc1",reason:"서비스 간 통신 장애인 Cascading Failure를 경험해보세요"},{id:"sc2",reason:"분산 환경에서 멱등성 보장도 중요합니다"}],
      interviewQs: [
        "SAGA 패턴이란 무엇이고, 2PC와 비교했을 때 MSA에서 더 적합한 이유는?",
        "Orchestration과 Choreography 방식의 SAGA를 비교하고, 각각 어떤 상황에 적합한지 설명해주세요.",
        "보상 트랜잭션이 실패하면 어떻게 처리해야 하나요? DLQ와 멱등키의 역할은?"
      ],
      codeChallenge: {
        title: "SAGA Orchestrator 보상 트랜잭션 구현",
        prompt: "결제는 성공했지만 주문 생성이 실패했을 때, 결제를 자동으로 취소하는 보상 트랜잭션을 구현하세요. 재시도, 멱등키, DLQ를 고려해야 합니다.",
        starterCode: "@Service\npublic class OrderSagaOrchestrator {\n\n    private final PaymentClient paymentClient;\n    private final OrderRepository orderRepo;\n\n    public void handleOrderFailure(String paymentId, String orderId) {\n        // TODO: 보상 트랜잭션 구현\n        // 1. 결제 취소 API 호출 (멱등키 포함)\n        // 2. 실패 시 재시도 (최대 3회)\n        // 3. 재시도 실패 시 DLQ에 저장\n        // 4. 고객에게 알림 발송\n        paymentClient.cancel(paymentId);\n    }\n}",
        hint: "멱등키로 중복 취소를 방지하고, @Retryable로 재시도를 구현하세요. 최종 실패 시 DLQ 테이블에 INSERT하고 알림을 보냅니다."
      }
    }
  },
  {
    id: "sc10", role: "백엔드 개발자 (온콜)", brief: "월요일 아침에 출근했더니 서비스가 2시간째 죽어있었습니다. 아무도 몰랐습니다. 3,200건의 주문이 유실되었습니다.", why: "모니터링 없는 서비스는 눈 감고 운전하는 것과 같습니다. '서버가 죽었는데 아무도 몰랐다'는 이커머스에서 가장 치명적인 운영 실패입니다.", title: "서버가 죽었는데 아무도 몰랐다",
    company: "퀵딜 — 실시간 타임딜 커머스",
    tags: ["헬스체크", "모니터링", "SRE"], diff: "초급", dur: "10분", cat: "운영 이슈", icon: "📡", clr: "#059669",
    nodes: {
      start: {
        time: "07:30", title: "무감지 장애 — 2시간 다운", phase: "investigate",
        nar: ["월요일 아침 출근. 서비스가 안 됩니다!", "**새벽 5:30부터** order-service DOWN. **2시간 동안 알림 없이** 중단. 약 **3,200건 주문 유실**."],
        clues: {
          prompt: "장애 원인과 감지 실패 이유를 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "server", label: "📋 서버 상태", content: [
              { t: "05:30:00", lv: "error", m: "order-service: java.lang.OutOfMemoryError: Java heap space" },
              { t: "05:30:01", lv: "error", m: "order-service: Process killed by OOM Killer" },
              { t: "05:30:01", lv: "warn", m: "No alert configured! Nobody notified!" }
            ]},
            { id: "metric", label: "📊 피해 현황", metrics: [
              { l: "장애 시간", v: "2시간", s: "danger", u: "05:30~07:30" },
              { l: "유실 주문", v: "3,200건", s: "danger", u: "알림 시 30분 복구" },
              { l: "모니터링", v: "없음", s: "danger", u: "헬스체크 미설정" }
            ]},
            { id: "infra", label: "🏗 인프라 현황", content: [
              { t: "", lv: "warn", m: "Spring Actuator: 미설정" },
              { t: "", lv: "warn", m: "Prometheus: 미설치" },
              { t: "", lv: "warn", m: "Grafana: 미설치" },
              { t: "", lv: "error", m: "알림(Slack/PagerDuty): 없음" },
              { t: "", lv: "info", m: "Eureka: 인스턴스 DOWN 표시되지만 알림 없음" }
            ]}
          ]
        },
        timer: 40,
        freeFirst: "서버가 2시간 동안 죽어있었는데 아무도 몰랐습니다. 이런 사각지대를 없애려면 어떤 시스템이 필요할까요?",
        q: "이런 사각지대를 어떻게 없앨까?",
        hint: "서버가 죽었을 때 자동으로 알려주는 시스템이 필요합니다.",
        ch: [
          { id: "A", text: "Actuator + Prometheus + Grafana + 알림", desc: "헬스체크, 메트릭 수집, 대시보드, 임계치 알림", g: "best", nx: "s10r",
            impact: { "감지 시간": "수초~1분", "알림": "자동 슬랙/전화", "가시성": "대시보드" } },
          { id: "B", text: "Eureka DOWN 감지 시 슬랙 알림", desc: "서비스 디스커버리 레벨 감지", g: "ok", nx: "s10r",
            impact: { "감지 시간": "30초~2분", "알림": "DOWN만 감지", "가시성": "제한적" } },
          { id: "C", text: "직원 24시간 교대 모니터링", desc: "사람이 감시", g: "bad", nx: "s10_bad",
            impact: { "감지 시간": "불확실", "알림": "사람 의존", "비용": "인건비 높음" } }
        ],
        fb: {
          A: { t: "🟢 현업 표준!", b: "**4단계 Observability**: ① Actuator /health ② Prometheus(수집) ③ Grafana(시각화) ④ AlertManager(알림).", cost: "스택 구축·대시보드·알림 룰 튜닝에 **초기 공수**가 필요합니다.", r: "대부분 현업이 Prometheus+Grafana 기본 사용." },
          B: { t: "🟡 부분적", b: "인스턴스 DOWN은 감지하지만 응답 지연, 에러율 급증 등 **세밀한 감지 어려움**.", cost: "피크 타임 **느려짐·부분 장애**는 여전히 놓치기 쉽습니다.", r: "" },
          C: { t: "🔴 비효율", b: "사람 집중력 한계. 자동화보다 반응 느림.", cost: "야간·주말 교대와 **인건비**가 장기적으로 큽니다.", r: "" }
        },
        tradeoff: [
          { option: "Prometheus+Grafana", time: "구축 1~2일", risk: "없음", dataLoss: "없음", note: "현업 표준" },
          { option: "Eureka 알림만", time: "수시간", risk: "세밀한 감지 불가", dataLoss: "없음", note: "부분적 해결" },
          { option: "사람 모니터링", time: "즉시", risk: "높음", dataLoss: "없음", note: "비현실적" }
        ]
      },
      s10_bad: {
        time: "08:00", title: "교대 감시 — 또 장애 놓침", phase: "action",
        nar: ["교대 인력을 배치했지만 **3일 뒤 또 장애가 발생**했습니다.", "이번엔 서버는 살아있었지만 **응답시간이 8초**로 느려져 있었습니다. 야간 근무자는 **서버 UP 상태만 확인**하고 넘어갔습니다."],
        clues: {
          prompt: "왜 사람 모니터링이 실패했는지 확인합니다.",
          options: [
            { id: "blind", label: "📋 놓친 신호", content: [
              { t: "03:00", lv: "warn", m: "p99 latency: 200ms → 8,200ms (서버 UP이지만 사실상 장애)" },
              { t: "03:00", lv: "warn", m: "에러율: 0.1% → 23% (HTTP 200 안에 비즈니스 에러 포함)" },
              { t: "08:00", lv: "error", m: "야간 근무자 확인: 'Eureka 인스턴스 UP, 이상 없음'" }
            ]},
            { id: "cost3", label: "📊 비용 비교", metrics: [
              { l: "야간 인건비", v: "월 500만+", s: "warning", u: "최소 3교대" },
              { l: "자동 감지", v: "월 5만원", s: "ok", u: "Prometheus+Grafana" },
              { l: "장애 감지율", v: "20%", s: "danger", u: "사람은 UP/DOWN만 봄" }
            ]},
            { id: "auto", label: "🛠 자동화 대안", content: [
              { t: "", lv: "info", m: "Actuator + Prometheus → Latency, Error rate, Saturation 자동 수집" },
              { t: "", lv: "info", m: "AlertManager → 임계치 초과 시 즉시 Slack/PagerDuty 알림" }
            ]}
          ]
        },
        freeFirst: "서버가 UP인데 장애인 경우를 사람이 어떻게 발견할 수 있나요? **'살아있다'와 '정상이다'의 차이**를 한두 문장으로 적어보세요.",
        slack: { name: "야간 근무자 김대리", time: "08:00", body: "어… 서버는 UP 상태라 괜찮은 줄 알았는데, 응답시간이 8초였다고요? 그건 제가 **확인할 방법이 없었어요.**" },
        met: [
          { l: "응답시간", v: "8.2s", s: "danger", u: "5시간째 지속" },
          { l: "유실 주문", v: "~1,800건", s: "danger", u: "사실상 장애" },
          { l: "인건비", v: "월 500만+", s: "warning", u: "3교대" }
        ],
        timer: 20,
        q: "사람 모니터링의 한계를 체감했습니다. 어떤 시스템이 필요한가요?",
        ch: [
          { id: "A", text: "Actuator + Prometheus + Grafana + 알림 자동화", desc: "메트릭 자동 수집, 임계치 알림, 대시보드", g: "best", nx: "s10r",
            impact: { "감지 시간": "수초", "비용": "월 5만원", "커버리지": "Latency·Errors·Saturation" } },
          { id: "B", text: "Eureka DOWN 감지 + 슬랙 알림", desc: "서비스 디스커버리 레벨 감지", g: "ok", nx: "s10r",
            impact: { "감지 시간": "30초~2분", "비용": "낮음", "커버리지": "DOWN만 감지" } }
        ],
        fb: {
          A: { t: "🟢 교훈을 얻었습니다", b: "사람은 **'서버 UP'만 확인**합니다. Latency 스파이크, 에러율 증가 같은 **미묘한 징후**는 자동화된 메트릭 수집과 알림만이 잡아낼 수 있습니다.", cost: "야간 교대 인력 **해제·재배치**와 자동화 전환 기간이 필요합니다.", r: "" },
          B: { t: "🟡 부분적 개선", b: "인스턴스 DOWN은 잡지만, 이번처럼 **UP인데 느린 경우**는 여전히 놓칩니다.", cost: "사람 비용은 줄어도 **세밀한 장애 감지**는 불가합니다.", r: "" }
        },
        tradeoff: [
          { option: "Prometheus+Grafana", time: "구축 1~2일", risk: "없음", dataLoss: "없음", note: "95% 장애 감지" },
          { option: "Eureka 알림만", time: "수시간", risk: "세밀한 감지 불가", dataLoss: "없음", note: "UP/DOWN만" }
        ]
      },
      s10r: {
        time: "09:00", title: "모니터링 지표 설계", phase: "action",
        nar: ["모니터링 구축. 핵심 지표는?"],
        clues: {
          prompt: "지표를 고르기 전, 이번 사고에서 놓친 신호를 봅니다.",
          options: [
            { id: "missed", label: "📋 놓친 신호", content: [
              { t: "05:30", lv: "error", m: "OOM — 하지만 **알림 규칙 없음**" },
              { t: "07:00", lv: "warn", m: "Eureka DOWN — **Slack 연동 없음**" }
            ]},
            { id: "biz", label: "📊 비즈니스 지표", metrics: [
              { l: "주문 건수", v: "0", s: "danger", u: "2시간 널뜻" },
              { l: "감지", v: "사람 신고", s: "danger", u: "자동 아님" }
            ]},
            { id: "golden", label: "✅ 골든 vs 인프라", content: [
              { t: "", lv: "info", m: "CPU 정상이어도 **Latency↑·Errors↑** 가 먼저일 수 있음" }
            ]}
          ]
        },
        freeFirst: "인프라 메트릭만 보던 팀이라면, 이번처럼 놓치기 쉬운 신호는 무엇일까요? **앱 레벨**에서 무엇을 보라고 하시겠어요?",
        slack: { name: "CTO 박서연", time: "08:50", body: "2시간 무감지는 말도 안 됩니다. **이번 주 안에 모니터링 구축해주세요.** 최소한 서비스가 죽으면 1분 안에 알림이 와야 합니다." },
        timer: 30,
        q: "핵심 모니터링 지표(Golden Signals)?",
        ch: [
          { id: "A", text: "4대 골든 시그널: Latency, Traffic, Errors, Saturation", desc: "Google SRE 정의 4대 핵심 지표", g: "best", nx: "s10a",
            impact: { "장애 감지율": "95%+", "커버리지": "대부분의 장애", "출처": "Google SRE" } },
          { id: "B", text: "CPU, 메모리, 디스크", desc: "인프라 리소스", g: "ok", nx: "s10a",
            impact: { "장애 감지율": "60%", "커버리지": "인프라만", "출처": "전통적 모니터링" } },
          { id: "C", text: "주문 수, 매출, 전환율", desc: "비즈니스 지표", g: "ok", nx: "s10a",
            impact: { "장애 감지율": "40%", "커버리지": "비즈니스만", "출처": "BI 팀" } }
        ],
        fb: {
          A: { t: "🟢 Google SRE 4대 골든 시그널!", b: "**Latency**(응답시간), **Traffic**(요청량), **Errors**(에러율), **Saturation**(포화도). 대부분의 장애를 조기 감지.", cost: "알림 **노이즈**와의 싸움 — 임계치·SLO 튜닝이 지속 과제입니다.", r: "Google SRE 책 핵심 개념. 면접에서 이것 답하면 강력." },
          B: { t: "🟡 필요하지만 부족", b: "CPU 100%는 결과. 애플리케이션 레벨 지표가 더 빠른 감지.", cost: "컨테이너만 보면 **JVM heap·GC** 문제를 놓칠 수 있습니다.", r: "" },
          C: { t: "🟡 비즈니스 모니터링도 중요", b: "주문 수 급감이 장애 첫 신호. 기술+비즈니스 함께.", cost: "비즈니스 지표는 **지연**이 있어 장애 감지가 늦을 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "골든 시그널 4종", time: "구축 1~2일", risk: "없음", dataLoss: "없음", note: "장애 95% 감지" },
          { option: "인프라 메트릭만", time: "수시간", risk: "앱 장애 놓침", dataLoss: "없음", note: "부분적" },
          { option: "비즈니스 지표만", time: "수시간", risk: "기술 장애 놓침", dataLoss: "없음", note: "보조 수단" }
        ]
      },
      s10a: {
        time: "10:00", title: "알림 설계 + Runbook 작성", phase: "postmortem",
        nar: ["골든 시그널 기반 모니터링을 구축했습니다. 이제 **알림이 오면 누가, 무엇을, 어떤 순서로** 해야 하는지 정의해야 합니다.", "CTO: '대시보드는 만들었는데, 새벽에 알림 오면 어떻게 하죠?'"],
        clues: {
          prompt: "알림 전략과 Runbook의 필요성을 확인합니다.",
          options: [
            { id: "noise", label: "📋 알림 노이즈 사례", content: [
              { t: "", lv: "warn", m: "CPU 알림 100건/일 → 팀이 알림을 무시하기 시작 → '알림 피로'" },
              { t: "", lv: "info", m: "SLO 기반 알림: '에러 버짓 소진률 > 50%/시간' → 진짜 중요한 것만" }
            ]},
            { id: "oncall", label: "📊 온콜 현황", metrics: [
              { l: "온콜 로테이션", v: "미설정", s: "danger", u: "새벽 장애 대응자 없음" },
              { l: "Runbook", v: "없음", s: "danger", u: "대응 절차 미정의" },
              { l: "에스컬레이션", v: "미정의", s: "warning", u: "누구에게 올릴지 불명확" }
            ]},
            { id: "run", label: "🛠 Runbook 예시", content: [
              { t: "", lv: "info", m: "알림: order-service p99 > 3s → 1) Grafana 확인 2) 로그 확인 3) 재시작 or 롤백" },
              { t: "", lv: "info", m: "알림: 에러율 > 5% → 1) 최근 배포 확인 2) 롤백 판단 3) 장애 선언" }
            ]}
          ]
        },
        freeFirst: "알림이 너무 많으면 무시하게 되고(알림 피로), 너무 적으면 놓칩니다. **정말 중요한 알림만** 보내려면 어떤 기준을 세워야 할까요?",
        slack: { name: "팀리드 박과장", time: "09:55", body: "대시보드 좋습니다. 근데 **새벽에 알림 오면 누가 받죠?** 온콜 로테이션이랑 Runbook이 없으면 알림이 와도 대응을 못 합니다. 이번처럼요." },
        q: "알림 체계와 운영 프로세스를 어떻게 설계하시겠습니까?",
        ch: [
          { id: "A", text: "SLO 기반 알림 + 온콜 로테이션 + Runbook + 에스컬레이션", desc: "에러 버짓 소진률 기반 알림, 주간 온콜 교대, 장애별 대응 절차서, 30분 미대응 시 에스컬레이션", g: "best", nx: "end",
            impact: { "알림 품질": "노이즈 최소화", "새벽 대응": "온콜자 즉시 확인", "대응 시간": "Runbook으로 단축" } },
          { id: "B", text: "임계치 알림만 설정 (CPU>90%, 에러율>10%)", desc: "단순 수치 기반 알림", g: "ok", nx: "end",
            impact: { "알림 품질": "노이즈 높음", "새벽 대응": "누가 받을지 불명확", "대응 시간": "사람마다 다름" } }
        ],
        fb: {
          A: { t: "🟢 SRE 조직 수준!", b: "**SLO 기반 알림**은 '고객 영향이 있을 때만' 알리므로 알림 피로를 줄입니다. **온콜 + Runbook + 에스컬레이션**은 '누가, 무엇을, 언제까지'를 명확히 합니다.", cost: "Runbook 작성과 온콜 문화 정착에 **팀 단위 합의**가 필요합니다.", r: "Google, Netflix, 토스 등은 SLO/에러 버짓 기반 알림과 온콜 로테이션을 운영합니다." },
          B: { t: "🟡 시작은 되지만", b: "단순 임계치 알림은 **노이즈가 많아** 팀이 곧 무시하게 됩니다. 새벽 알림을 누가 받을지도 정해져 있지 않습니다.", cost: "알림 피로로 **정작 중요한 알림을 놓치는** 이번과 같은 상황이 반복됩니다.", r: "" }
        },
        tradeoff: [
          { option: "SLO+온콜+Runbook", time: "1~2주", risk: "매우 낮음", dataLoss: "없음", note: "조직적 대응" },
          { option: "임계치 알림만", time: "수시간", risk: "알림 피로", dataLoss: "없음", note: "대응자 불명확" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "헬스체크/모니터링/알림 없어 2시간 무감지 장애.",
      qa: [
        { q: "4대 골든 시그널?", a: "Latency, Traffic, Errors, Saturation. Google SRE 정의." },
        { q: "Spring Boot 모니터링?", a: "Actuator+Micrometer -> Prometheus -> Grafana -> AlertManager." }
      ],
      checklist: [
        "물류 프로젝트에 spring-boot-starter-actuator 의존성을 추가하세요.",
        "application.yml에 management.endpoints.web.exposure.include=health,metrics,prometheus를 설정하세요.",
        "/actuator/health를 호출해보세요. DB, Redis 연결 상태가 표시되나요?",
        "docker-compose에 Prometheus + Grafana 컨테이너를 추가하고, Spring Boot 메트릭을 수집해보세요.",
        "Grafana에서 응답시간, 에러율 대시보드를 하나 만들어보세요."
      ],
      pl: "물류 프로젝트 Zipkin에 Prometheus+Grafana 추가하면 Observability 어필.",
      nextRec: [{id:"sc6",reason:"모니터링 다음은 안전한 배포 전략입니다"},{id:"sc1",reason:"모니터링이 있었다면 이 장애를 빠르게 잡을 수 있었습니다"}],
      interviewQs: [
        "Google SRE의 4대 골든 시그널(Latency, Traffic, Errors, Saturation)을 각각 설명하고, 왜 중요한지 말해주세요.",
        "Spring Boot 애플리케이션에 모니터링을 구축하는 전체 스택(Actuator → Prometheus → Grafana → AlertManager)을 설명해주세요.",
        "'서버가 UP이지만 장애인 상황'을 어떻게 감지할 수 있나요?"
      ],
      codeChallenge: {
        title: "Prometheus AlertManager 알림 규칙 작성",
        prompt: "주문 서비스의 에러율이 5%를 넘거나 p99 응답시간이 3초를 넘으면 Slack으로 알림이 가도록 Prometheus AlertManager 규칙을 작성하세요.",
        starterCode: "# prometheus-alerts.yml\ngroups:\n- name: order-service-alerts\n  rules:\n  - alert: HighErrorRate\n    # TODO: 에러율 > 5% 조건\n    expr: |\n      # http_server_requests_seconds_count 메트릭 활용\n    for: 1m\n    labels:\n      severity: critical\n    annotations:\n      summary: \"주문 서비스 에러율 {{ $value }}%\"\n\n  - alert: HighLatency\n    # TODO: p99 응답시간 > 3초 조건\n    expr: |\n      # http_server_requests_seconds 히스토그램 메트릭 활용\n    for: 2m\n    labels:\n      severity: warning\n    annotations:\n      summary: \"주문 서비스 p99 {{ $value }}초\"",
        hint: "rate()와 histogram_quantile() 함수를 활용하세요. status=~'5..'로 에러 응답만 필터링합니다."
      }
    }
  }
];
