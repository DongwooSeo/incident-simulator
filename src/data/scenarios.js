export const SCENARIOS = [
  {
    id: "sc1", role: "주니어 백엔드 개발자", brief: "금요일 저녁 피크타임에 주문 서비스가 죽기 시작했습니다. 3만 명의 고객이 주문을 못 하고 있습니다.", why: "MSA 면접에서 거의 반드시 나오는 질문입니다. 이걸 모르면 입사 후 첫 장애에서 무력해집니다.", title: "금요일 피크타임, 주문이 사라지고 있다",
    company: "배달잇츠 — MAU 800만 음식 배달 플랫폼",
    tags: ["Cascading Failure", "서킷브레이커", "MSA"], diff: "중급", dur: "12분", cat: "장애 대응", icon: "🔥", clr: "#ef4444",
    nodes: {
      start: {
        time: "19:03", title: "장애 인지", phase: "investigate",
        nar: ["금요일 저녁 7시 피크타임. 주문이 쏟아지는 중입니다.", "갑자기 #incident-alert 슬랙 채널이 폭발합니다."],
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
          A: { t: "🔴 상황 악화", b: "재시작 중 남은 인스턴스까지 DOWN. **원인 파악 없이 재시작하면 같은 문제로 다시 죽습니다.**", r: "2022년 한 대형 커머스에서 성급한 재시작으로 30분 장애가 2시간으로 확대." },
          B: { t: "🟢 정확한 첫 대응!", b: "장애 대응 첫 단계: ① 팀 공유 ② 로그/메트릭 확인 ③ Incident Commander 지정. **혼자 판단하지 않는 것**이 핵심.", r: "토스, 배달의민족 등은 장애 대응 매뉴얼(Runbook)에서 첫 단계는 항상 상황 공유." },
          C: { t: "🟡 비즈니스 피해 큼", b: "전체 차단 시 **모든 고객 주문 불가**. 원인 파악 후 부분적 트래픽 제어가 더 현명합니다.", r: "" }
        },
        tradeoff: [
          { option: "재시작", time: "1분", risk: "매우 높음", dataLoss: "진행중 주문 유실", note: "원인 미파악 시 재발" },
          { option: "팀 공유+분석", time: "5~10분", risk: "낮음", dataLoss: "없음", note: "가장 안전한 첫 대응" },
          { option: "트래픽 차단", time: "즉시", risk: "중간", dataLoss: "없음", note: "비즈니스 피해 큼" }
        ]
      },
      step2_bad: {
        time: "19:10", title: "상황 악화 — 서비스 완전 중단", phase: "action",
        nar: ["인스턴스 재시작 중 남은 1개까지 DOWN. **주문 서비스 완전 중단. 7분을 허비했습니다.**", "이제라도 원인을 파악해야 합니다. Zipkin을 확인하니 **FeignClient 동기 호출이 전체를 블로킹**하고 있었습니다."],
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
        slack: { name: "CTO 박서연", time: "19:10", body: "주문이 완전히 멈췄다는데 무슨 상황인가요? 재시작했다고 들었는데 왜 더 악화된 건가요?" },
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
        nar: ["서비스가 다시 살아나고 있지만, **7분간의 완전 중단** 동안 약 **4,200건의 주문이 유실**되었습니다.", "CTO 박서연님이 전체 인시던트 채널에 메시지를 남겼습니다."],
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
        slack: { name: "CTO 박서연", time: "19:15", body: "7분간의 중단은 큰 피해입니다. 복구 후 **유실된 4,200건에 대한 보상 방안**과 **왜 초기 대응이 늦어졌는지** 포스트모템에서 다뤄주세요. 지금은 복구에 집중합시다." },
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
        nar: ["분석 결과: 주문 생성 시 **4개 외부 서비스를 FeignClient로 동기 호출**.", "delivery-service 지연이 order-service 스레드를 블로킹 — **Cascading Failure**."],
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
        slack: { name: "CTO 박서연", time: "19:08", body: "상황 파악 감사합니다. 금요일 피크타임 매출이 시간당 4억인데 70% 이상 날아가고 있어요. **20분 안에 주문이 최소한 돌아가게 해주세요.** 배송은 나중에 수동으로 처리할 수 있습니다." },
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
        nar: ["서비스 복구 완료. 포스트모템에서 장기 개선안을 제시합니다."],
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
        freeFirst: "장기 개선을 논의합니다. **기술·프로세스·조직** 중 이번 사고에서 가장 먼저 손대야 할 축은 무엇이라고 보시나요? (한두 문장)",
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
        "FeignClient 호출 부분을 grep해서 찾아보세요. 몇 개나 있나요?",
        "각 FeignClient에 타임아웃 설정이 있나요? (feign.client.config.default.connectTimeout)",
        "Resilience4j 의존성을 추가하고 @CircuitBreaker + fallback 메서드를 구현해보세요.",
        "Zipkin 트레이스에서 가장 느린 외부 호출이 뭔지 확인해보세요."
      ],
      pl: "물류 프로젝트에서 FeignClient로 배송을 동기 호출했다면 동일한 구조. 서킷 브레이커 추가가 포트폴리오 어필 포인트.",
      nextRec: [
        { id: "sc9", reason: "이 장애의 근본 원인인 '분산 트랜잭션'을 더 깊이 파헤쳐보세요" },
        { id: "sc4", reason: "서비스 간 장애 전파를 막는 또 다른 인프라 전략을 경험해보세요" }
      ]
    }
  },
  {
    id: "sc2", role: "결제 서비스 담당 개발자", brief: "고객의 카드에서 같은 금액이 두 번 빠졌습니다. 47건의 이중 결제가 발생 중입니다.", why: "결제가 있는 모든 서비스에서 반드시 겪는 문제. 멱등성을 모르면 프로덕션에 투입될 수 없습니다.", title: "고객이 결제가 두 번 됐다고 합니다",
    company: "마켓플러스 — 일 주문 50만 건 종합 이커머스",
    tags: ["멱등성", "결제", "데이터 정합성"], diff: "중급", dur: "12분", cat: "데이터 정합성", icon: "💳", clr: "#a855f7",
    nodes: {
      start: {
        time: "11:23", title: "CS 인입 — 이중 결제", phase: "investigate",
        nar: ["월요일 오전. CS팀에서 긴급 연락.", "고객 3명이 같은 주문에 **결제가 2번** 됐다고 합니다. 최근 1시간 동안 **47건** 발생."],
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
          A: { t: "🟢 정확한 진단!", b: "Gateway 타임아웃 시 클라이언트 재시도로 **같은 결제 2번 실행**. 서버에서 **멱등키** 기반 중복 감지가 없었습니다.", r: "Stripe, 토스페이먼츠 등 모든 결제 API는 멱등키를 필수로 요구합니다." },
          B: { t: "🟡 원인 중 하나지만 근본 아님", b: "프론트 방어는 필요하지만, **서버 측 방어 없이는 API 재시도로 여전히 이중 결제 발생**.", r: "" },
          C: { t: "🔴 관련 없음", b: "트랜잭션 격리 수준은 이 문제와 무관합니다.", r: "" }
        },
        tradeoff: [
          { option: "멱등성 키(서버)", time: "2~3시간", risk: "낮음", dataLoss: "없음", note: "근본 해결" },
          { option: "프론트 버튼 비활성화", time: "30분", risk: "높음", dataLoss: "없음", note: "서버 재시도 못 막음" },
          { option: "격리 수준 변경", time: "1시간", risk: "높음", dataLoss: "가능", note: "잘못된 방향" }
        ]
      },
      s2fix_bad: {
        time: "11:35", title: "잘못된 방향 — 시간 낭비", phase: "action",
        nar: ["격리 수준을 변경했지만 **이중 결제가 계속 발생**합니다. 15분을 허비했습니다.", "다시 로그를 보니 **같은 orderId로 결제 API가 2번 호출**된 것이 원인이었습니다."],
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
        slack: { name: "PG팀 김대리", time: "11:35", body: "결제 취소 요청이 계속 들어오고 있어요. 원인 파악 됐나요? 이중 결제 건수가 **62건**으로 늘었습니다." },
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
        slack: { name: "PG팀 김대리", time: "11:48", body: "멱등성 적용 확인했습니다. 이제 기존 62건 환불을 진행해야 하는데, **수동으로 1건씩 하면 3시간**, 일괄 처리 스크립트를 짜면 30분입니다. 어떻게 하시겠어요?" },
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
        nar: ["원인 파악 완료. 현재도 이중 결제 계속 발생 중입니다. 빠르게 막아야 합니다."],
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
        slack: { name: "CS팀 이수진", time: "11:38", body: "고객 항의 전화가 계속 오고 있어요. SNS에도 올라오기 시작했습니다. **빨리 막아주세요!**" },
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
        "물류 프로젝트의 주문 생성 API를 찾아보세요. 같은 요청이 2번 오면 주문이 2개 생기나요?",
        "Redis에 SETNX로 orderId 기반 멱등키를 구현해보세요. TTL은 5분.",
        "FeignClient의 retry 설정이 있는지 확인하세요. 재시도 시 멱등성이 보장되나요?",
        "p_orders 테이블에 unique constraint가 있는지 확인해보세요."
      ],
      pl: "물류 프로젝트 주문 API가 재시도되면 중복 주문 가능. 멱등키 도입으로 데이터 정합성 보장 경험 어필.",
      nextRec: [
        { id: "sc3", reason: "재고 관리에서도 데이터 정합성 문제가 발생합니다" },
        { id: "sc9", reason: "MSA에서 서비스 간 정합성을 보장하는 SAGA 패턴을 경험해보세요" }
      ]
    }
  },
  {
    id: "sc3", role: "커머스 백엔드 개발자", brief: "한정판 100개를 팔았는데 주문이 203건 들어왔습니다. 103명에게 취소 연락을 해야 합니다.", why: "동시성 제어는 이커머스 면접의 단골 주제. 이 문제를 풀 수 있으면 시니어 수준의 역량입니다.", title: "한정판 100개인데 200개가 팔렸다",
    company: "딜카트 — 일 100만 PV 한정판 딜 플랫폼",
    tags: ["동시성", "Race Condition", "재고 관리"], diff: "상급", dur: "12분", cat: "동시성 문제", icon: "🏷️", clr: "#22c55e",
    nodes: {
      start: {
        time: "12:00", title: "한정판 딜 — 초과 판매", phase: "investigate",
        nar: ["정오 12시. **100개 한정 스니커즈** 딜 시작. **3만 명 동시 접속**.", "1분 만에 품절 표시. 그런데 주문이 **203건**. 103건 초과 판매."],
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
        nar: ["서버를 3배로 늘렸더니 **동시에 재고를 읽는 스레드가 더 많아져** 초과 판매가 **312건**으로 악화되었습니다."],
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
        slack: { name: "운영팀 박과장", time: "12:30", body: "초과 판매가 312건으로 늘었어요! 서버 늘린 후에 더 심해진 것 같은데... 재고 로직 자체에 문제가 있는 거 아닌가요?" },
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
        nar: ["재고 로직은 수정했지만, **312건의 초과 판매된 주문**은 취소해야 합니다.", "고객들은 이미 결제가 완료된 상태이고, SNS에서 불만이 퍼지기 시작했습니다."],
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
        freeFirst: "기술적으론 환불이 맞지만, **감정·신뢰** 측면에서 고객에게 무엇을 더해야 한다고 보시나요?",
        slack: { name: "CS팀 이팀장", time: "12:40", body: "312명한테 전화가 미친 듯이 오고 있어요. **'한정판 샀는데 취소라니'** 하면서 격앙된 고객이 많습니다. 빨리 대응 방침을 정해주세요." },
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
        nar: ["103명에게 주문 취소와 보상 쿠폰을 발송했습니다. 이제 재고 차감 로직을 개선합니다."],
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
        slack: { name: "MD팀 최리더", time: "12:50", body: "다음 주 한정판 딜이 또 있는데, 이번엔 확실하게 해결해주세요. 같은 사고 반복되면 안 됩니다." },
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
        "물류 프로젝트의 재고 차감 코드를 찾아보세요. SELECT 후 UPDATE하고 있나요?",
        "UPDATE p_products SET stock = stock - :qty WHERE id = :id AND stock >= :qty 로 변경해보세요.",
        "영향받은 row가 0이면 '재고 부족' 예외를 던지도록 처리하세요.",
        "JMeter나 k6로 동시 100건 주문 테스트를 해보세요. 초과 판매가 발생하나요?"
      ],
      pl: "물류 프로젝트에서 주문 시 재고 차감에 원자적 UPDATE를 적용하면 동시성 제어 경험 어필.",
      nextRec: [{id:"sc8",reason:"동시성 문제의 또 다른 형태인 데드락을 경험해보세요"},{id:"sc2",reason:"결제에서도 동시 요청 문제가 발생합니다"}]
    }
  },
  {
    id: "sc4", role: "인프라/백엔드 개발자", brief: "Redis가 OOM으로 죽었고, 2,000만 PV의 캐시가 전부 사라졌습니다. DB가 95% CPU로 비명을 지르고 있습니다.", why: "Redis를 사용하는 모든 서비스에서 발생 가능. 캐시 전략 없이 대규모 서비스를 운영할 수 없습니다.", title: "Redis가 죽자 DB가 따라 죽었다",
    company: "쇼핑온 — 일 PV 2,000만 패션 커머스",
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
          A: { t: "🟢 정확!", b: "**Cache Stampede(Thundering Herd)**: 캐시 소실 시 동시에 DB로 몰리는 현상. **Mutex Lock 패턴**으로 하나만 DB 조회, 나머지는 대기.", r: "Instagram, Twitter 등은 캐시 워밍업 전용 배치를 운영합니다." },
          B: { t: "🟡 임시방편", b: "스케일업은 시간이 걸리고, 캐시 없이 DB만으로 운영하는 건 비현실적.", r: "" },
          C: { t: "🔴 서비스 마비", b: "Redis가 있는 이유 = **DB만으로 현재 트래픽 감당 불가**.", r: "" }
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
        slack: { name: "DBA 한시니어", time: "10:11", body: "DB가 죽었어요! 캐시 없이 이 트래픽을 DB가 감당할 수 없습니다. **Redis 없이는 서비스 불가**입니다. 빨리 캐시를 다시 살려주세요." },
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
        slack: { name: "인프라팀 정시니어", time: "10:14", body: "Redis 새 마스터 정상 가동 중. 메모리 여유 있습니다. 캐시 워밍업 시작해주세요. **DB가 오래 못 버팁니다.**" },
        timer: 30,
        q: "캐시 워밍업을 어떻게?",
        hint: "같은 상품을 수천 명이 동시 조회하면 같은 DB 쿼리가 수천 번 실행됩니다.",
        ch: [
          { id: "A", text: "Mutex Lock: 캐시 미스 시 하나만 DB 조회, 나머지 대기", desc: "Redis SETNX로 락. 같은 키에 DB 쿼리 1번만.", g: "best", nx: "end" },
          { id: "B", text: "인기 상품 Top 1000 배치 캐싱", desc: "핫 데이터 우선 워밍업", g: "ok", nx: "end" },
          { id: "C", text: "TTL 랜덤 설정으로 동시 만료 방지", desc: "jitter로 만료 시점 분산", g: "ok", nx: "end" }
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
      end: { type: "end" }
    },
    pm: {
      rc: "Redis OOM 크래시 후 전체 캐시 초기화, 모든 요청이 DB로 몰리는 Cache Stampede.",
      qa: [
        { q: "Cache Stampede란?", a: "캐시 소실 시 많은 요청이 동시에 DB로 몰리는 현상. Mutex Lock, TTL jitter로 방지." },
        { q: "Redis 운영 핵심?", a: "maxmemory-policy(OOM 방지), Sentinel(고가용성), 앱 레벨 Mutex Lock." }
      ],
      checklist: [
        "물류 프로젝트에서 @Cacheable을 사용하고 있다면, 캐시 미스 시 동시 요청이 모두 DB를 때리는지 확인하세요.",
        "Redis maxmemory-policy가 설정되어 있나요? allkeys-lru를 권장합니다.",
        "캐시 TTL에 jitter(랜덤 값)를 추가해보세요: TTL + Random(0, 300)초.",
        "Redis Sentinel 또는 Cluster가 구성되어 있는지 확인하세요."
      ],
      pl: "물류 프로젝트에서 허브 정보를 캐싱했다면 Redis 장애 대응 전략을 포트폴리오에.",
      nextRec: [{id:"sc1",reason:"캐시 장애가 서비스 전체로 전파되는 Cascading Failure를 경험해보세요"},{id:"sc7",reason:"DB 성능 최적화도 함께 익혀보세요"}]
    }
  },
  {
    id: "sc5", role: "백엔드 개발자", brief: "상품 목록 API가 20초나 걸립니다. 사용자의 78%가 페이지를 떠나고 있습니다.", why: "JPA를 사용하는 프로젝트에서 가장 흔하게 발생하는 문제. 면접에서 N+1을 설명 못 하면 탈락입니다.", title: "상품 목록 API가 20초씩 걸립니다",
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
          A: { t: "🟢 정확!", b: "**N+1 쿼리**: 목록 1회 + 각 상품마다 카테고리(50)+리뷰(50) 등 = 251. JPA **Lazy Loading**이 연관 엔티티 접근 시 개별 SELECT.", r: "N+1은 JPA 프로젝트의 가장 흔한 성능 문제. 면접 단골." },
          B: { t: "🟡 부분적", b: "인덱스 문제라면 쿼리 수가 아니라 개별 쿼리 시간이 문제. 여기선 **쿼리 수** 자체가 핵심.", r: "" },
          C: { t: "🔴 관련 없음", b: "커넥션 부족이면 Connection not available 에러. 여기선 쿼리 수 문제.", r: "" }
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
        slack: { name: "프론트 김개발", time: "14:33", body: "아직도 20초예요. 뭘 바꾼 건가요? **15분 넘게 기다렸는데** 사용자 이탈이 심각합니다." },
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
        nar: ["N+1 쿼리를 해결해야 합니다."],
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
        slack: { name: "프론트 김개발", time: "14:55", body: "상품 목록 페이지가 아직도 20초 걸려요. 사용자 이탈률이 78%입니다. **오늘 안에 해결 가능한가요?**" },
        timer: 30,
        q: "어떤 방식?",
        ch: [
          { id: "A", text: "Fetch Join 또는 @EntityGraph", desc: "연관 엔티티 한 번에 조회", g: "best", nx: "end",
            impact: { "쿼리 수": "251 -> 1~2개", "응답시간": "20s -> 200ms", "주의사항": "컬렉션 페이징 주의" } },
          { id: "B", text: "@BatchSize로 IN절 배치", desc: "IN절로 묶어 조회", g: "ok", nx: "end",
            impact: { "쿼리 수": "251 -> 6개", "응답시간": "20s -> 400ms", "주의사항": "없음" } },
          { id: "C", text: "Eager Loading 전환", desc: "@ManyToOne(fetch=EAGER)", g: "bad", nx: "end",
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
      end: { type: "end" }
    },
    pm: {
      rc: "JPA Lazy Loading N+1 쿼리. 상품 50건 조회 시 연관 엔티티 개별 SELECT 251회.",
      qa: [
        { q: "N+1이란? 해결법?", a: "목록 조회 후 N건 각각에 추가 쿼리. Fetch Join, @EntityGraph, @BatchSize로 해결." },
        { q: "Fetch Join vs @BatchSize?", a: "Fetch Join: 쿼리 1개로 축소, 컬렉션 페이징 제한. @BatchSize: IN절로 유연하게 줄임." }
      ],
      checklist: [
        "spring.jpa.show-sql=true로 설정하고 목록 API를 호출해보세요. 쿼리가 몇 개 나오나요?",
        "N+1이 발생하는 엔티티를 찾아 @EntityGraph 또는 Fetch Join JPQL을 적용해보세요.",
        "@BatchSize(size=100)을 엔티티 클래스에 적용해보고 쿼리 수 변화를 확인하세요.",
        "p6spy 라이브러리를 추가하면 실행된 SQL과 바인딩 파라미터를 한눈에 볼 수 있습니다."
      ],
      pl: "물류 프로젝트 주문+배송 목록 조회 시 N+1 발생 가능. Fetch Join 적용 어필.",
      nextRec: [{id:"sc7",reason:"N+1 해결 후 인덱스 최적화도 함께 적용해보세요"},{id:"sc4",reason:"DB 부하를 줄이는 캐시 전략도 중요합니다"}]
    }
  },
  {
    id: "sc6", role: "백엔드 개발자 (배포 담당)", brief: "할인 로직을 배포했는데 결제 금액이 0원으로 찍힙니다. 5분간 127건의 무료 주문이 발생했습니다.", why: "모든 개발자가 한 번은 겪는 배포 사고. 롤백과 안전 배포 전략은 현업 필수 역량입니다.", title: "배포했는데 결제 금액이 0원으로 찍힌다",
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
          { id: "A", text: "즉시 이전 버전으로 롤백", desc: "kubectl rollout undo", g: "best", nx: "s6a",
            impact: { "0원 결제": "즉시 중단", "복구 시간": "1분", "추가 위험": "없음" } },
          { id: "B", text: "버그 수정 핫픽스 배포", desc: "할인율 로직 수정 후 재배포", g: "ok", nx: "s6a",
            impact: { "0원 결제": "15분간 계속", "복구 시간": "15분", "추가 위험": "핫픽스 버그 가능" } },
          { id: "C", text: "결제 API 일시 차단", desc: "추가 피해 방지", g: "ok", nx: "s6a",
            impact: { "0원 결제": "즉시 중단", "복구 시간": "즉시", "추가 위험": "전체 주문 중단" } }
        ],
        fb: {
          A: { t: "🟢 최우선 조치!", b: "**Roll forward보다 rollback이 먼저** — 현업 철칙. 롤백은 검증된 이전 버전. 핫픽스는 새 코드로 추가 버그 위험. 롤백 1분, 핫픽스 15분.", r: "대부분 기업에서 배포 5분 내 문제 시 자동 롤백(Auto Rollback) 설정." },
          B: { t: "🟡 시간 걸리고 위험", b: "수정, 리뷰, 빌드, 배포 최소 15분. 그 동안 0원 결제 계속. **핫픽스도 새 코드이므로 추가 버그 가능.**", r: "" },
          C: { t: "🟡 과도한 조치", b: "정상 주문까지 전부 중단. 롤백이 가능한 상황에서 **불필요한 비즈니스 피해**.", r: "" }
        },
        tradeoff: [
          { option: "롤백", time: "1분", risk: "없음", dataLoss: "없음", note: "검증된 이전 버전" },
          { option: "핫픽스", time: "15분", risk: "새 버그 가능", dataLoss: "15분간 0원 결제", note: "급하면 실수 유발" },
          { option: "API 차단", time: "즉시", risk: "매출 중단", dataLoss: "없음", note: "롤백이 더 나은 선택" }
        ]
      },
      s6a: {
        time: "11:00", title: "재발 방지 — 배포 안전장치", phase: "postmortem",
        nar: ["롤백으로 정상화. 0원 결제 127건은 수동 처리 중.", "이런 사고를 방지하려면?"],
        clues: {
          prompt: "재발 방지안을 설득하기 위한 근거를 모읍니다.",
          options: [
            { id: "post", label: "📋 포스트모템 요약", content: [
              { t: "", lv: "info", m: "원인: 할인율 단위 버그 — 코드 리뷰에서 **경계값 테스트 누락**" },
              { t: "", lv: "warn", m: "스테이징 데이터가 프로덕션과 **금액 분포 상이**" }
            ]},
            { id: "cost127", label: "💰 127건 처리", metrics: [
              { l: "수동 환불·정산", v: "진행 중", s: "warning", u: "재무·CS 동시 투입" },
              { l: "반복 시", v: "치명적", s: "danger", u: "브랜드+규제" }
            ]},
            { id: "tools", label: "🛠 도구 비교", content: [
              { t: "", lv: "info", m: "Feature Flag: 배포는 하되 **할인 로직만 OFF** 가능" },
              { t: "", lv: "info", m: "카나리: 에러율·결제 0원 건수 알람 연동" }
            ]}
          ]
        },
        freeFirst: "QA 강화만으로는 부족하다고 했을 때, **프로덕션에서 막는 장치**로 무엇을 제일 먼저 도입하시겠어요?",
        slack: { name: "CTO 박서연", time: "10:55", body: "롤백 빠르게 해줘서 고맙습니다. 하지만 이런 일이 반복되면 안 됩니다. **포스트모템에서 재발 방지안 발표해주세요.**" },
        q: "배포 프로세스에 어떤 안전장치를 추가하시겠습니까?",
        ch: [
          { id: "A", text: "카나리 배포 + 자동 롤백 + Feature Flag", desc: "5% 트래픽 검증, 에러율 급증 시 자동 롤백, 기능 ON/OFF", g: "best", nx: "end",
            impact: { "카나리": "5% 트래픽으로 검증", "자동 롤백": "에러율 임계치 초과 시", "Feature Flag": "코드 배포와 기능 분리" } },
          { id: "B", text: "스테이징 QA 강화", desc: "배포 전 테스트 철저히", g: "ok", nx: "end",
            impact: { "QA 커버리지": "높아짐", "프로덕션 방어": "없음", "비용": "QA 시간 증가" } }
        ],
        fb: {
          A: { t: "🟢 현업 배포 안전장치 3종 세트!", b: "**카나리**: 5%로 검증 후 확대. **자동 롤백**: 임계치 초과 시. **Feature Flag**: 코드 배포와 기능 활성화 분리.", cost: "인프라·플랫폼 팀과 **SLA·알림 룰**을 맞추는 초기 비용이 듭니다.", r: "쿠팡, 토스, 네이버 등 모두 사용." },
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
      rc: "할인율 버그가 QA 통과하여 프로덕션 배포. 카나리/자동 롤백 부재로 127건 0원 결제.",
      qa: [
        { q: "카나리 배포란?", a: "새 버전을 5~10% 트래픽에만 적용하여 검증. 문제 시 영향 최소화." },
        { q: "Feature Flag 왜?", a: "코드 배포와 기능 활성화 분리. 배포 후에도 ON/OFF로 위험 관리." }
      ],
      checklist: [
        "물류 프로젝트의 Docker 배포 스크립트를 확인하세요. 롤백 명령어가 준비되어 있나요?",
        "docker-compose.yml에 이전 이미지 태그를 기록해두세요. 롤백 시 즉시 사용.",
        "배포 후 5분간 주요 API 응답 코드를 모니터링하는 스크립트를 만들어보세요.",
        "Feature Flag 라이브러리(Unleash, FF4j)를 조사하고 하나를 적용해보세요."
      ],
      pl: "물류 프로젝트 Docker 배포에 카나리 전략 적용 어필.",
      nextRec: [{id:"sc10",reason:"배포 후 문제를 빠르게 감지하려면 모니터링이 필수입니다"},{id:"sc1",reason:"배포 실패가 장애로 이어지는 시나리오를 경험해보세요"}]
    }
  },
  {
    id: "sc7", role: "백엔드 개발자", brief: "검색 API가 3개월 전 200ms에서 4.5초로 느려졌습니다. 상품이 200만 건으로 늘어나면서 선형적으로 악화 중.", why: "인덱스와 EXPLAIN을 읽는 능력은 백엔드 면접에서 가장 기본적인 역량 중 하나입니다.", title: "검색 API가 점점 느려지고 있다",
    company: "리뷰마켓 — 상품 200만 건 리뷰 커머스",
    tags: ["Slow Query", "인덱스", "EXPLAIN"], diff: "초급", dur: "10분", cat: "성능 문제", icon: "🔍", clr: "#06b6d4",
    nodes: {
      start: {
        time: "16:00", title: "검색 API 성능 저하", phase: "investigate",
        nar: ["상품 검색 응답시간 **3개월 전 200ms에서 현재 4.5초**. 데이터 증가에 따라 선형적 악화."],
        clues: {
          prompt: "원인을 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "slow", label: "📋 Slow Query 로그", content: [
              { t: "16:00:01", lv: "warn", m: "Slow query (4523ms): SELECT * FROM p_products WHERE name LIKE '%운동화%' AND category_id=3 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 30" }
            ]},
            { id: "explain", label: "🔍 EXPLAIN 결과", content: [
              { t: "", lv: "error", m: "type: ALL (풀 테이블 스캔!)" },
              { t: "", lv: "error", m: "rows: 2,143,892 (200만 행 전부 읽음)" },
              { t: "", lv: "warn", m: "Extra: Using where; Using filesort" },
              { t: "", lv: "info", m: "possible_keys: NULL (사용 가능한 인덱스 없음)" }
            ]},
            { id: "metric", label: "📊 DB 메트릭", metrics: [
              { l: "쿼리 시간", v: "4.5초", s: "danger", u: "목표 200ms" },
              { l: "스캔 행 수", v: "200만", s: "danger", u: "전체 테이블" },
              { l: "DB CPU", v: "72%", s: "warning", u: "검색 시 급증" }
            ]}
          ]
        },
        timer: 40,
        freeFirst: "EXPLAIN 결과를 보고, 왜 쿼리가 4.5초나 걸리는지 분석해보세요. type=ALL이 무엇을 의미하는지 생각해보세요.",
        q: "EXPLAIN 결과를 진단하세요.",
        hint: "type=ALL은 무엇을 의미할까요? rows=2,143,892는요?",
        ch: [
          { id: "A", text: "풀 테이블 스캔 — 적절한 인덱스 없음", desc: "type=ALL은 200만 행 전부 스캔", g: "best", nx: "s7f",
            impact: { "진단": "정확", "다음 단계": "인덱스 설계" } },
          { id: "B", text: "ORDER BY가 filesort 유발", desc: "정렬에 인덱스 미활용", g: "ok", nx: "s7f",
            impact: { "진단": "부분적", "다음 단계": "filesort는 부가 문제" } },
          { id: "C", text: "DB 서버 메모리 부족", desc: "메모리 늘리면 개선", g: "bad", nx: "s7_bad",
            impact: { "진단": "잘못된 방향", "다음 단계": "효과 없음" } }
        ],
        fb: {
          A: { t: "🟢 정확!", b: "**type=ALL** = 풀 테이블 스캔. `(category_id, deleted_at, created_at)`에 **복합 인덱스**를 추가하면 극적 개선.", r: "인덱스 하나로 100배 이상 개선 흔합니다." },
          B: { t: "🟡 부가적 문제", b: "인덱스에 created_at 포함하면 해결. 근본은 풀스캔.", r: "" },
          C: { t: "🔴 근본 해결 아님", b: "인덱스 없이 200만 행 스캔은 메모리와 무관.", r: "" }
        },
        tradeoff: [
          { option: "인덱스 추가", time: "수초", risk: "없음", dataLoss: "없음", note: "근본 해결" },
          { option: "filesort 개선만", time: "-", risk: "낮음", dataLoss: "없음", note: "풀스캔은 남음" },
          { option: "메모리 증설", time: "10~30분", risk: "없음", dataLoss: "없음", note: "효과 미미" }
        ]
      },
      s7_bad: {
        time: "16:20", title: "메모리 증설 — 효과 없음", phase: "action",
        nar: ["DB 메모리를 16GB에서 64GB로 늘렸지만 **쿼리 시간은 4.3초로 거의 변화 없습니다.**", "EXPLAIN을 다시 실행하니 여전히 **type=ALL, rows=2,143,892**입니다."],
        clues: {
          prompt: "메모리 증설이 왜 효과가 없는지 확인합니다.",
          options: [
            { id: "explain2", label: "🔍 EXPLAIN (재실행)", content: [
              { t: "", lv: "error", m: "type: ALL — 메모리와 무관, 실행 계획 자체가 풀스캔" },
              { t: "", lv: "warn", m: "rows: 2,143,892 — 여전히 전체 테이블 읽음" }
            ]},
            { id: "io", label: "📊 I/O 비교", metrics: [
              { l: "메모리 전", v: "4.5s", s: "danger", u: "디스크 I/O" },
              { l: "메모리 후", v: "4.3s", s: "danger", u: "버퍼 캐시 올라왔지만 스캔량 동일" },
              { l: "인덱스 적용 시", v: "~15ms", s: "ok", u: "예상" }
            ]},
            { id: "cost2", label: "💰 인프라 비용", content: [
              { t: "", lv: "warn", m: "64GB 인스턴스: 월 비용 4배 증가 — 효과는 5% 미만" }
            ]}
          ]
        },
        freeFirst: "메모리를 4배 늘려도 4.5→4.3초밖에 안 줄었습니다. EXPLAIN의 **type=ALL**이 의미하는 것을 다시 생각해보세요.",
        slack: { name: "DBA 한시니어", time: "16:18", body: "메모리 올려도 소용없어요. **풀 테이블 스캔은 메모리 문제가 아니라 실행 계획 문제**입니다. EXPLAIN 결과를 다시 보세요." },
        timer: 20,
        q: "메모리가 원인이 아니었습니다. 진짜 문제는?",
        ch: [
          { id: "A", text: "인덱스 없음 — type=ALL은 풀 테이블 스캔", desc: "200만 행을 매번 전부 읽는 것이 원인", g: "best", nx: "s7f",
            impact: { "진단": "정확", "예상 개선": "4.5s → 15ms" } },
          { id: "B", text: "쿼리 캐시를 활성화", desc: "같은 쿼리 결과를 메모리에 캐시", g: "ok", nx: "s7f",
            impact: { "진단": "보조적", "예상 개선": "반복 쿼리만 개선" } }
        ],
        fb: {
          A: { t: "🟢 이제 올바른 진단!", b: "**type=ALL**은 인덱스 없이 전체 행을 스캔한다는 뜻입니다. 메모리를 아무리 늘려도 **200만 행을 읽는 작업량 자체**는 줄지 않습니다.", cost: "메모리 증설 비용(월 4배)은 **불필요한 지출**이었습니다. 원복을 검토해야 합니다.", r: "" },
          B: { t: "🟡 보조적 수단", b: "쿼리 캐시는 동일 쿼리 반복 시만 효과적. 검색 조건이 다양하면 히트율이 낮습니다.", cost: "캐시 무효화 관리 부담이 추가됩니다.", r: "" }
        },
        tradeoff: [
          { option: "인덱스 추가", time: "수초", risk: "없음", dataLoss: "없음", note: "근본 해결" },
          { option: "쿼리 캐시", time: "설정 변경", risk: "낮음", dataLoss: "없음", note: "반복 쿼리만" }
        ]
      },
      s7f: {
        time: "16:30", title: "인덱스 설계", phase: "action",
        nar: ["인덱스를 추가합니다."],
        clues: {
          prompt: "인덱스 결정 전 쿼리 패턴을 다시 봅니다.",
          options: [
            { id: "q", label: "📋 쿼리 조건", content: [
              { t: "", lv: "info", m: "WHERE category_id = ? AND deleted_at IS NULL AND name LIKE '%운동화%'" },
              { t: "", lv: "warn", m: "LIKE '%...%' 는 인덱스 **range 축소에 한계** — 전문 검색은 별도" }
            ]},
            { id: "ord", label: "🔢 컬럼 순서", content: [
              { t: "", lv: "info", m: "등치(=) → 범위 → ORDER BY 순이 일반적" },
              { t: "", lv: "warn", m: "인덱스 과다 시 **쓰기 비용** 증가" }
            ]},
            { id: "es", label: "🔍 ES 검토", metrics: [
              { l: "데이터 규모", v: "200만", s: "ok", u: "인덱스로 우선" },
              { l: "형태소·랭킹", v: "미요구", s: "ok", u: "ES는 과할 수 있음" }
            ]}
          ]
        },
        freeFirst: "복합 인덱스 컬럼 순서를 정할 때, **WHERE와 ORDER BY**를 어떻게 우선하시겠어요?",
        slack: { name: "DBA 한시니어", time: "16:25", body: "EXPLAIN 결과 봤습니다. type=ALL이면 인덱스가 없다는 뜻이에요. **복합 인덱스 하나면 해결될 것 같은데, 컬럼 순서가 중요합니다.**" },
        timer: 30,
        q: "어떤 인덱스를 추가하시겠습니까?",
        ch: [
          { id: "A", text: "복합 인덱스: (category_id, deleted_at, created_at DESC)", desc: "WHERE+ORDER BY 커버", g: "best", nx: "end",
            impact: { "쿼리 시간": "4.5초 -> 15ms", "스캔 행": "200만 -> 2,400", "type": "ALL -> ref" } },
          { id: "B", text: "각 컬럼에 개별 인덱스", desc: "3개 개별 인덱스", g: "ok", nx: "end",
            impact: { "쿼리 시간": "4.5초 -> 800ms", "스캔 행": "부분 감소", "type": "ALL -> index_merge" } },
          { id: "C", text: "Elasticsearch 도입", desc: "전문 검색 엔진 분리", g: "ok", nx: "end",
            impact: { "쿼리 시간": "수ms", "도입 기간": "1~2주", "복잡도": "높음" } }
        ],
        fb: {
          A: { t: "🟢 최적!", b: "**복합 인덱스**가 WHERE+ORDER BY 한 번에 커버. 순서: **등치 조건, 범위 조건, 정렬**.", cost: "대량 마이그레이션 시 **온라인 DDL**·락 시간을 DBA와 조율해야 합니다.", r: "인덱스 설계는 면접 단골. EXPLAIN 읽는 법 필수." },
          B: { t: "🟡 비효율", b: "DB는 보통 인덱스 1개만 사용. 개별 3개보다 복합 1개가 효과적.", cost: "인덱스 **중복·유지보수 부담**이 커집니다.", r: "" },
          C: { t: "🟡 200만 건이면 인덱스로 충분", b: "1000만 건 이상이거나 형태소 분석 필요 시 ES.", cost: "ES는 **동기화 파이프라인** 운영 비용이 큽니다.", r: "" }
        },
        tradeoff: [
          { option: "복합 인덱스", time: "수초", risk: "없음", dataLoss: "없음", note: "4.5s -> 15ms" },
          { option: "개별 인덱스 3개", time: "수초", risk: "없음", dataLoss: "없음", note: "4.5s -> 800ms" },
          { option: "Elasticsearch", time: "1~2주", risk: "운영 복잡", dataLoss: "없음", note: "대규모에 적합" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "검색 쿼리에 인덱스 없어 200만 행 풀 테이블 스캔.",
      qa: [
        { q: "Slow Query 진단법?", a: "EXPLAIN으로 type, rows, Extra 분석." },
        { q: "복합 인덱스 컬럼 순서?", a: "등치(=) -> 범위(>) -> 정렬(ORDER BY)." }
      ],
      checklist: [
        "물류 프로젝트의 검색 API에 EXPLAIN을 실행해보세요. type이 ALL인 쿼리가 있나요?",
        "WHERE 절에 자주 사용되는 컬럼 조합을 찾아 복합 인덱스를 추가해보세요.",
        "deleted_at IS NULL 조건이 있다면 deleted_at을 인덱스에 포함하세요.",
        "p_orders, p_products 테이블에 인덱스가 몇 개 있는지 SHOW INDEX로 확인하세요."
      ],
      pl: "물류 프로젝트 검색 API에 EXPLAIN 실행해보세요. 인덱스 최적화 적용하면 어필 포인트.",
      nextRec: [{id:"sc5",reason:"인덱스와 함께 JPA N+1 문제도 점검해보세요"},{id:"sc8",reason:"DB 성능에서 데드락 문제도 중요합니다"}]
    }
  },
  {
    id: "sc8", role: "백엔드 개발자", brief: "주문이 간헐적으로 실패합니다. 로그에 Deadlock이라는 무시무시한 단어가 보입니다.", why: "트래픽이 높은 서비스에서 빈번하게 발생. 데드락 원인을 설명할 수 있으면 동시성 역량을 인정받습니다.", title: "주문과 재고가 서로 물고 있다",
    company: "프레시몰 — 일 주문 8만 건 신선식품몰",
    tags: ["데드락", "DB Lock", "동시성"], diff: "상급", dur: "10분", cat: "동시성 문제", icon: "🔄", clr: "#ec4899",
    nodes: {
      start: {
        time: "13:40", title: "간헐적 주문 실패 — 데드락", phase: "investigate",
        nar: ["점심 이후 주문 실패가 간헐적으로 발생. 에러 로그에 **Deadlock** 감지."],
        clues: {
          prompt: "데드락 원인을 파악하기 위해 어떤 정보를 확인하시겠습니까?",
          options: [
            { id: "error", label: "📋 에러 로그", content: [
              { t: "13:40:01", lv: "error", m: "Deadlock found when trying to get lock; try restarting transaction" }
            ]},
            { id: "detail", label: "🔍 데드락 상세 (SHOW ENGINE INNODB STATUS)", content: [
              { t: "", lv: "warn", m: "*** TRANSACTION A ***" },
              { t: "", lv: "warn", m: "HOLDS lock on p_products(id=101)" },
              { t: "", lv: "error", m: "WAITING for lock on p_orders(id=501)" },
              { t: "", lv: "warn", m: "*** TRANSACTION B ***" },
              { t: "", lv: "warn", m: "HOLDS lock on p_orders(id=502)" },
              { t: "", lv: "error", m: "WAITING for lock on p_products(id=101)" }
            ]},
            { id: "code", label: "💻 주문 처리 코드", content: [
              { t: "", lv: "info", m: "// OrderService.java - createOrder()" },
              { t: "", lv: "warn", m: "productRepo.decreaseStock(productId);  // UPDATE products 먼저" },
              { t: "", lv: "warn", m: "orderRepo.save(order);                 // INSERT orders 다음" },
              { t: "", lv: "info", m: "// PaymentService.java - processPayment()" },
              { t: "", lv: "error", m: "orderRepo.updateStatus(orderId);       // UPDATE orders 먼저" },
              { t: "", lv: "error", m: "productRepo.updateSoldCount(productId); // UPDATE products 다음" },
              { t: "", lv: "error", m: "// 순서가 반대!" }
            ]}
          ]
        },
        timer: 40,
        freeFirst: "데드락 상세 정보와 코드를 보고, 왜 데드락이 발생하는지 분석해보세요. 두 트랜잭션의 락 순서를 비교해보세요.",
        q: "데드락의 원인은?",
        hint: "Tx A와 B의 락 순서를 비교하세요. A는 products->orders, B는 orders->products.",
        ch: [
          { id: "A", text: "두 트랜잭션이 서로 다른 순서로 락을 획득", desc: "A: products->orders, B: orders->products. 순환 대기.", g: "best", nx: "s8f",
            impact: { "진단": "정확 (순환 대기)", "해결 방향": "락 순서 통일" } },
          { id: "B", text: "트랜잭션이 너무 길다", desc: "락 보유 시간이 김", g: "ok", nx: "s8f",
            impact: { "진단": "악화 요인", "해결 방향": "트랜잭션 단축" } },
          { id: "C", text: "동시 접속자 과다", desc: "트래픽 줄이면 해결", g: "bad", nx: "s8_bad",
            impact: { "진단": "잘못된 방향", "해결 방향": "효과 없음" } }
        ],
        fb: {
          A: { t: "🟢 정확!", b: "**순환 대기(Circular Wait)**: A가 products 잡고 orders 대기, B가 orders 잡고 products 대기. 해결: **모든 트랜잭션에서 락 순서 통일**.", r: "데드락은 모든 RDBMS에서 발생. 락 순서 통일이 근본 해결." },
          B: { t: "🟡 악화 요인이지만 근본 원인 아님", b: "짧게 해도 순서 다르면 발생.", r: "" },
          C: { t: "🔴 2건으로도 발생", b: "동시 접속 2명이어도 락 순서 다르면 데드락.", r: "" }
        },
        tradeoff: [
          { option: "락 순서 통일", time: "코드 수정", risk: "없음", dataLoss: "없음", note: "근본 해결" },
          { option: "트랜잭션 단축", time: "코드 수정", risk: "낮음", dataLoss: "없음", note: "확률만 감소" },
          { option: "트래픽 제한", time: "즉시", risk: "매출 감소", dataLoss: "없음", note: "관련 없는 조치" }
        ]
      },
      s8_bad: {
        time: "13:55", title: "트래픽 제한 — 데드락 계속 발생", phase: "action",
        nar: ["트래픽을 50%로 줄였지만 **데드락이 여전히 발생**합니다.", "동시 접속이 2명만 되어도 같은 에러가 나옵니다. 트래픽 양이 문제가 아니었습니다."],
        clues: {
          prompt: "트래픽 제한 후에도 데드락이 발생하는 이유를 확인합니다.",
          options: [
            { id: "innodb", label: "📋 InnoDB Status (재확인)", content: [
              { t: "13:55", lv: "error", m: "Tx A: products(101) LOCK → orders(501) WAIT" },
              { t: "13:55", lv: "error", m: "Tx B: orders(502) LOCK → products(101) WAIT" },
              { t: "13:55", lv: "warn", m: "2건의 동시 트랜잭션만으로도 재현" }
            ]},
            { id: "impact2", label: "📊 비즈니스 피해", metrics: [
              { l: "주문 실패율", v: "12%", s: "danger", u: "트래픽 줄여도 동일" },
              { l: "고객 불만", v: "증가", s: "warning", u: "트래픽 제한 + 데드락" },
              { l: "매출 손실", v: "2중", s: "danger", u: "트래픽↓ + 실패" }
            ]},
            { id: "pattern", label: "💻 락 순서 비교", content: [
              { t: "", lv: "error", m: "OrderService: products → orders (순서 1)" },
              { t: "", lv: "error", m: "PaymentService: orders → products (순서 2, 반대!)" },
              { t: "", lv: "warn", m: "순서가 다르면 2건만으로도 데드락" }
            ]}
          ]
        },
        freeFirst: "트래픽을 절반으로 줄여도 데드락이 나는 이유는? 동시 접속 **2명**만으로도 발생할 수 있는 구조적 이유를 적어보세요.",
        slack: { name: "운영팀 최과장", time: "13:53", body: "트래픽 절반으로 줄였는데 매출도 절반이에요. 그런데 데드락은 여전합니다. **이건 트래픽 문제가 아닌 것 같아요.**" },
        timer: 20,
        q: "트래픽 제한은 답이 아니었습니다. 데드락의 진짜 원인은?",
        ch: [
          { id: "A", text: "두 트랜잭션의 락 순서가 서로 반대", desc: "OrderService와 PaymentService가 다른 순서로 테이블 락 획득", g: "best", nx: "s8f",
            impact: { "데드락": "원인 파악", "매출": "트래픽 복구 가능" } },
          { id: "B", text: "트랜잭션 타임아웃을 줄여 빠르게 실패", desc: "innodb_lock_wait_timeout 감소", g: "ok", nx: "s8f",
            impact: { "데드락": "빠르게 해소", "매출": "실패율은 유지" } }
        ],
        fb: {
          A: { t: "🟢 이제 핵심을 짚었습니다", b: "데드락은 **트래픽 양이 아니라 락 순서**가 원인입니다. 2건만으로도 순서가 반대면 발생합니다.", cost: "트래픽 제한으로 **불필요한 매출 손실**이 발생했습니다. 즉시 트래픽을 복구해야 합니다.", r: "" },
          B: { t: "🟡 회피일 뿐", b: "타임아웃을 줄이면 데드락은 빠르게 해소되지만, **주문 실패는 계속 발생**합니다.", cost: "실패한 주문의 **재시도 처리** 부담이 남습니다.", r: "" }
        },
        tradeoff: [
          { option: "락 순서 파악", time: "-", risk: "없음", dataLoss: "없음", note: "근본 원인 도달" },
          { option: "타임아웃 감소", time: "즉시", risk: "낮음", dataLoss: "없음", note: "실패 빈도 유지" }
        ]
      },
      s8f: {
        time: "14:00", title: "데드락 해결", phase: "action",
        nar: ["락 순서를 통일해야 합니다."],
        clues: {
          prompt: "해결책의 운영 비용을 비교합니다.",
          options: [
            { id: "conv", label: "📋 컨벤션", content: [
              { t: "", lv: "info", m: "팀 규칙: 항상 products → orders → payments 순서" },
              { t: "", lv: "warn", m: "레거시·외부 팀 코드 **전수 조사** 필요" }
            ]},
            { id: "nowait", label: "⏱ NOWAIT", content: [
              { t: "", lv: "warn", m: "락 실패 시 재시도 — **사용자에게는 간헐적 실패**로 보일 수 있음" }
            ]},
            { id: "mon", label: "📊 모니터링", metrics: [
              { l: "데드락 재발", v: "0 목표", s: "ok", u: "InnoDB status 알림" }
            ]}
          ]
        },
        freeFirst: "락 순서 통일은 근본 해결이지만 **코드 변경 범위**가 큽니다. NOWAIT+재시도와 비교해 무엇이 더 나은 타협인가요?",
        slack: { name: "주문팀 이개발", time: "13:55", body: "저도 PaymentService에서 orders 먼저 업데이트하고 있었어요. 저쪽 코드도 같이 바꿔야 할 것 같습니다." },
        timer: 30,
        q: "어떻게 해결하시겠습니까?",
        ch: [
          { id: "A", text: "모든 트랜잭션에서 항상 products->orders 순서로 통일", desc: "코드 컨벤션으로 강제", g: "best", nx: "end",
            impact: { "데드락": "완전 해소", "성능": "변화 없음", "유지보수": "컨벤션 필요" } },
          { id: "B", text: "SELECT FOR UPDATE에 NOWAIT 추가", desc: "락 못 잡으면 에러 후 재시도", g: "ok", nx: "end",
            impact: { "데드락": "회피 (발생은 가능)", "성능": "재시도 비용", "유지보수": "재시도 로직" } }
        ],
        fb: {
          A: { t: "🟢 근본 해결!", b: "**락 순서 통일**이 정석. 코드 리뷰 시 테이블 업데이트 순서를 체크포인트로.", cost: "여러 서비스·팀과 **일정 합의**가 필요하고 롤아웃 기간이 깁니다.", r: "대부분의 팀에서 테이블 접근 순서 규칙을 문서화합니다." },
          B: { t: "🟡 회피 전략", b: "재시도 로직 잘 구현 필요. 주문 실패율 높아질 수 있음.", cost: "피크 시간대 **재시도 폭주**로 부하가 증가할 수 있습니다.", r: "" }
        },
        tradeoff: [
          { option: "락 순서 통일", time: "코드 수정", risk: "없음", dataLoss: "없음", note: "영구적 해결" },
          { option: "NOWAIT + 재시도", time: "코드 수정", risk: "실패율 증가", dataLoss: "없음", note: "회피만 가능" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "두 트랜잭션이 다른 순서로 락 획득하여 순환 대기(Circular Wait) 발생.",
      qa: [{ q: "데드락이란? 방지법?", a: "여러 트랜잭션이 서로의 락을 대기. 모든 트랜잭션에서 락 순서 통일로 방지." }],
      checklist: [
        "물류 프로젝트에서 여러 테이블을 한 트랜잭션에서 UPDATE하는 코드를 찾아보세요.",
        "각 서비스에서 테이블 접근 순서가 일관적인지 확인하세요.",
        "팀 코드 컨벤션에 '테이블 업데이트 순서: products -> orders -> deliveries' 규칙을 추가하세요.",
        "MySQL이라면 SHOW ENGINE INNODB STATUS로 데드락 로그를 확인하는 방법을 익히세요."
      ],
      pl: "물류 프로젝트 주문+재고+배송 트랜잭션에서 락 순서 확인해보세요.",
      nextRec: [{id:"sc3",reason:"데드락과 함께 Race Condition도 동시성의 핵심입니다"},{id:"sc9",reason:"MSA에서의 트랜잭션 관리를 경험해보세요"}]
    }
  },
  {
    id: "sc9", role: "MSA 백엔드 개발자", brief: "고객의 카드에서 돈은 빠졌는데 주문 내역에 없습니다. 결제와 주문이 다른 DB를 사용하기 때문입니다.", why: "MSA 전환 시 반드시 마주하는 문제. SAGA 패턴을 모르면 MSA를 설계할 수 없습니다.", title: "결제는 됐는데 주문이 안 만들어졌다",
    company: "원커머스 — MSA 기반 종합 커머스",
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
          { id: "B", text: "2PC(Two-Phase Commit)", desc: "코디네이터가 전체 관리", g: "ok", nx: "s9i",
            impact: { "정합성": "보장", "복잡도": "매우 높음", "성능": "병목" } },
          { id: "C", text: "결제+주문을 같은 서비스로 합침", desc: "하나의 트랜잭션으로", g: "ok", nx: "s9i",
            impact: { "정합성": "보장", "복잡도": "낮음", "확장성": "포기" } }
        ],
        fb: {
          A: { t: "🟢 MSA 분산 트랜잭션 표준!", b: "**SAGA**: 주문 생성, 결제, (성공)확정 / (실패)취소. 실패 시 **보상 트랜잭션**. Choreography 또는 Orchestration.", r: "쿠팡, 배달의민족 등 대규모 MSA에서 필수." },
          B: { t: "🟡 현실적 어려움", b: "2PC는 성능 병목, 단일 장애점, 복잡성으로 MSA에서 거의 미사용.", r: "" },
          C: { t: "🟡 MSA 장점 포기", b: "합치면 독립 배포/확장 장점 상실.", r: "" }
        },
        tradeoff: [
          { option: "SAGA 패턴", time: "1~2주", risk: "낮음", dataLoss: "보상으로 복구", note: "MSA 표준" },
          { option: "2PC", time: "2~4주", risk: "높음 (병목)", dataLoss: "없음", note: "거의 미사용" },
          { option: "서비스 합치기", time: "3~5일", risk: "없음", dataLoss: "없음", note: "MSA 장점 상실" }
        ]
      },
      s9i: {
        time: "15:00", title: "SAGA 구현 방식", phase: "action",
        nar: ["SAGA 도입 결정. 구현 방식 선택."],
        clues: {
          prompt: "구현 방식의 운영·조직 영향을 확인합니다.",
          options: [
            { id: "orch", label: "🎛 Orchestration", content: [
              { t: "", lv: "info", m: "중앙 Orchestrator — 타임아웃·재시도·보상 한곳에서" },
              { t: "", lv: "warn", m: "Orchestrator **SPOF** — HA 설계 필요" }
            ]},
            { id: "chor", label: "📨 Choreography", content: [
              { t: "", lv: "info", m: "이벤트만으로 느슨한 결합" },
              { t: "", lv: "error", m: "분산 추적·디버깅 어려움 — **이벤트 스키마** 엄격히" }
            ]},
            { id: "pay", label: "💳 결제 도메인", metrics: [
              { l: "감사 추적", v: "필수", s: "danger", u: "규제·정산" },
              { l: "권장", v: "Orchestration", s: "ok", u: "핵심 플로우" }
            ]}
          ]
        },
        freeFirst: "결제·주문이 흩어진 MSA에서, **한눈에 플로우를 보여줘야 하는 사람**은 누구인가요? (감사·CS·온콜 등)",
        slack: { name: "결제팀 박시니어", time: "14:50", body: "SAGA 도입 찬성합니다. 다만 **Choreography로 하면 이벤트 흐름 추적이 어렵습니다.** 결제처럼 중요한 플로우는 Orchestration을 추천합니다." },
        timer: 30,
        q: "Choreography vs Orchestration?",
        ch: [
          { id: "A", text: "Orchestration — 중앙 Saga Orchestrator", desc: "흐름 한 곳 관리, 디버깅 용이", g: "best", nx: "end",
            impact: { "흐름 파악": "쉬움 (한 곳)", "디버깅": "용이", "결합도": "중간" } },
          { id: "B", text: "Choreography — 이벤트 발행/구독", desc: "느슨한 결합, 유연한 확장", g: "ok", nx: "end",
            impact: { "흐름 파악": "어려움 (분산)", "디버깅": "어려움", "결합도": "매우 낮음" } }
        ],
        fb: {
          A: { t: "🟢 관리 용이!", b: "**Orchestration**: 흐름 한 곳. 디버깅/모니터링 쉬움. 복잡한 비즈니스에 적합.", cost: "Orchestrator 팀이 **장애 책임**을 지는 구조가 되므로 조직 합의가 필요합니다.", r: "결제 같은 핵심 플로우는 Orchestration 선호." },
          B: { t: "🟡 느슨한 결합", b: "결합 낮고 확장 유연. 하지만 전체 흐름 파악 어렵고 디버깅 어려움.", cost: "**이벤트 버전 호환**·데드 레터 큐 운영 비용이 큽니다.", r: "" }
        },
        tradeoff: [
          { option: "Orchestration", time: "1~2주", risk: "Orchestrator 장애", dataLoss: "없음", note: "핵심 플로우에 적합" },
          { option: "Choreography", time: "1~2주", risk: "이벤트 유실", dataLoss: "가능", note: "단순한 플로우에 적합" }
        ]
      },
      end: { type: "end" }
    },
    pm: {
      rc: "MSA에서 결제/주문 별도 DB, 한쪽 실패 시 데이터 불일치.",
      qa: [
        { q: "SAGA 패턴이란?", a: "MSA 분산 트랜잭션 패턴. 각 서비스 로컬 트랜잭션, 실패 시 보상 트랜잭션으로 되돌림." },
        { q: "Orchestration vs Choreography?", a: "Orchestration: 중앙 관리, 디버깅 용이. Choreography: 이벤트 기반, 느슨한 결합." }
      ],
      checklist: [
        "물류 프로젝트에서 주문 생성 시 배송도 함께 생성되나요? 배송 생성이 실패하면 주문은 어떻게 되나요?",
        "FeignClient 호출이 실패했을 때 보상 로직(결제 취소 등)이 구현되어 있나요?",
        "Spring ApplicationEvent를 사용해 간단한 Choreography SAGA를 구현해보세요.",
        "보상 트랜잭션(Compensating Transaction) 메서드를 하나 만들어보세요."
      ],
      pl: "물류 프로젝트 주문+배송 생성에 SAGA 패턴 적용 어필.",
      nextRec: [{id:"sc1",reason:"서비스 간 통신 장애인 Cascading Failure를 경험해보세요"},{id:"sc2",reason:"분산 환경에서 멱등성 보장도 중요합니다"}]
    }
  },
  {
    id: "sc10", role: "백엔드 개발자 (온콜)", brief: "월요일 아침에 출근했더니 서비스가 2시간째 죽어있었습니다. 아무도 몰랐습니다. 3,200건의 주문이 유실되었습니다.", why: "모니터링 없는 서비스는 눈 감고 운전하는 것과 같습니다. Golden Signals는 SRE 면접 필수 지식.", title: "서버가 죽었는데 아무도 몰랐다",
    company: "퀵딜 — 실시간 딜 커머스",
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
          A: { t: "🟢 현업 표준!", b: "**4단계 Observability**: ① Actuator /health ② Prometheus(수집) ③ Grafana(시각화) ④ AlertManager(알림).", r: "대부분 현업이 Prometheus+Grafana 기본 사용." },
          B: { t: "🟡 부분적", b: "인스턴스 DOWN은 감지하지만 응답 지연, 에러율 급증 등 **세밀한 감지 어려움**.", r: "" },
          C: { t: "🔴 비효율", b: "사람 집중력 한계. 자동화보다 반응 느림.", r: "" }
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
          { id: "A", text: "4대 골든 시그널: Latency, Traffic, Errors, Saturation", desc: "Google SRE 정의 4대 핵심 지표", g: "best", nx: "end",
            impact: { "장애 감지율": "95%+", "커버리지": "대부분의 장애", "출처": "Google SRE" } },
          { id: "B", text: "CPU, 메모리, 디스크", desc: "인프라 리소스", g: "ok", nx: "end",
            impact: { "장애 감지율": "60%", "커버리지": "인프라만", "출처": "전통적 모니터링" } },
          { id: "C", text: "주문 수, 매출, 전환율", desc: "비즈니스 지표", g: "ok", nx: "end",
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
      nextRec: [{id:"sc6",reason:"모니터링 다음은 안전한 배포 전략입니다"},{id:"sc1",reason:"모니터링이 있었다면 이 장애를 빠르게 잡을 수 있었습니다"}]
    }
  }
];
