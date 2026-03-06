-- Enhanced AI Agent Design Patterns Article with PDF Content

UPDATE articles SET content = '
<h2>Giới Thiệu: Từ Demo đến Production</h2>

<p>Doanh nghiệp đang áp dụng Generative AI thường gặp khó khăn với các vấn đề như <strong>hallucinations</strong>, <strong>latency</strong>, và <strong>chi phí cao</strong>. Giải pháp không nằm ở việc cải thiện prompting, mà ở <strong>Agentic Design Patterns</strong>.</p>

<blockquote>
Chúng ta đang chuyển từ việc "yêu cầu" models làm việc gì đó, sang việc "thiết kế" hệ thống có khả năng hoàn thành workflows một  cách có hệ thống.
</blockquote>

<h2>1. Dịch Vụ Khách Hàng: Intent Routing Pattern</h2>

<h3>🎯 Vấn Đề</h3>
<p>Một chatbot đơn lẻ không thể xử lý hiệu quả cả technical execution lẫn emotional de-escalation.</p>

<h3>✅ Giải Pháp: The Intelligent Triage Model</h3>

<p><strong>Cấu Trúc:</strong></p>
<ul>
    <li><strong>TRIAGE AGENT</strong> (Classification)
        <ul>
            <li>Phân loại intent từ user request</li>
            <li>Route đến agent phù hợp</li>
        </ul>
    </li>
    <li><strong>API AGENT</strong> (Transactional)
        <ul>
            <li>Reset Password</li>
            <li>Check Status</li>
            <li>Update Address</li>
        </ul>
    </li>
    <li><strong>EMPATHY AGENT</strong> (Emotional/Complaint)
        <ul>
            <li>Sentiment Analysis</li>
            <li>De-escalation Tone</li>
            <li>Human Handoff Prep</li>
        </ul>
    </li>
</ul>

<h2>2. E-Learning: Personal Tutor Pattern với Memory + RAG</h2>

<h3>🎓 Hyper-Personalization and Safety at Scale</h3>

<p><strong>Kiến Trúc "The Agent Brain":</strong></p>
<ul>
    <li><strong>Context</strong> → Personalization</li>
    <li><strong>RAG</strong> → Đảm bảo không hallucinate chính sách công ty</li>
    <li><strong>Guardrails</strong> → Safety net cuối cùng</li>
</ul>

<p><strong>Flow:</strong></p>
<ol>
    <li>User interaction → Memory lưu trữ context</li>
    <li>RAG retrieval → Lấy thông tin từ Company Knowledge Base</li>
    <li>Guardrails check → Phát hiện sensitive topics</li>
    <li>Response hoặc Human Handoff</li>
</ol>

<h2>3. DevOps: Multi-Agent Collaboration Pattern</h2>

<h3>⚙️ The Virtual Engineering Squad</h3>

<p><strong>Cấu Trúc Squad:</strong></p>
<ul>
    <li><strong>MANAGER AGENT</strong>
        <ul>
            <li>Assigns tasks</li>
            <li>Coordinates workflow</li>
            <li>Xác nhận bug detected → Send back to Dev</li>
        </ul>
    </li>
    <li><strong>DEV AGENT</strong>
        <ul>
            <li>Generates Code</li>
        </ul>
    </li>
    <li><strong>QA AGENT</strong>
        <ul>
            <li>Reviews Syntax & Logic</li>
            <li>Reflection pattern để tự kiểm tra</li>
        </ul>
    </li>
</ul>

<h2>4. Infrastructure: Reasoning & Planning Pattern</h2>

<h3>🏗️ Autonomous Planning and Orchestration</h3>

<p><strong>Ví dụ: "Migrate Database to AWS"</strong></p>

<p><strong>Workflow Planning:</strong></p>
<ol>
    <li><strong>Step 1: Schema Check</strong> → Analyze current DB structure</li>
    <li><strong>Step 2: Provisioning</strong> → Create RDS Instance</li>
    <li><strong>Step 3: Execution</strong> → Run migration scripts</li>
    <li><strong>Step 4: Validation</strong> → Verify data integrity</li>
</ol>

<h2>5. Content Operations: Prompt Chaining & Parallelization</h2>

<h3>✍️ Industrialized Creativity</h3>

<p><strong>Pattern A: Chaining (The Assembly Line)</strong></p>
<ol>
    <li>Outline Agent</li>
    <li>Draft Agent</li>
    <li>Critique Agent</li>
    <li>Polish Agent</li>
    <li>Review & Feedback</li>
</ol>

<p><strong>Pattern B: Parallelization (Market Research)</strong></p>
<ul>
    <li>Competitor A Analysis</li>
    <li>Competitor B Analysis</li>
    <li>Market Trends</li>
    <li><strong>AGGREGATOR AGENT</strong> → Synthesis → Completed Report</li>
</ul>

<h2>6. Innovation: Exploration Pattern</h2>

<h3>💡 Algorithmic Inspiration</h3>

<p>Sử dụng Agent không chỉ để viết, mà để <strong>tìm ra các góc nhìn bạn đã bỏ lỡ</strong>.</p>

<p><strong>Exploration Dimensions:</strong></p>
<ul>
    <li>Reverse Chronology</li>
    <li>Alternate Reality</li>
    <li>Ethical Dilemma</li>
    <li>Symbolic Motifs</li>
    <li>Historical Parallels</li>
    <li>Cross-Genre fusion</li>
</ul>

<p><strong>Result:</strong> Untapped Market Opportunities</p>

<h2>7. Critical Operations: Human-in-the-Loop (HITL)</h2>

<h3>🔐 High-Stakes Decision Making</h3>

<p><strong>Context:</strong> Finance, Security, VIP Communications</p>

<p><strong>Rule:</strong> <em>Agents prepare. Humans decide.</em></p>

<p><strong>Workflow:</strong></p>
<ol>
    <li><strong>Preparation</strong> → Agent drafts email, stages transaction</li>
    <li><strong>Human Review</strong> → Decision point</li>
    <li><strong>Approve/Reject</strong> → Execution or revision</li>
</ol>

<h2>8. Accuracy: Tool Use / Function Calling Pattern</h2>

<h3>🎯 Determinism in a Probabilistic System</h3>

<p><strong>Vấn Đề:</strong> LLM có thể hallucinate khi tính toán</p>
<p><strong>Giải Pháp:</strong> Orchestrator LLM + Deterministic Tools</p>

<p><strong>Examples:</strong></p>
<ul>
    <li>245 × 932 = ? → <code>CALCULATOR / PYTHON</code></li>
    <li>Stock Price → <code>API: STOCK_PRICE</code></li>
</ul>

<h2>9. Economics: Model Routing Pattern</h2>

<h3>💰 Resource-Aware Computing</h3>

<p><strong>Sorting Station Strategy:</strong></p>
<ul>
    <li><strong>Low Complexity</strong> (Greetings, FAQ) → LLAMA-3-8B (Low Cost/High Speed)</li>
    <li><strong>High Complexity</strong> (Strategic Analysis) → GPT-4 (High Cost/High Intelligence)</li>
</ul>

<p><strong>Result:</strong> 60-80% Reduction in Operational Costs</p>

<h2>10. Operational Discipline: Objective Supervision Pattern</h2>

<h3>🎛️ Guardrails Against Drift</h3>

<p><strong>Scenario:</strong> Primary Objective: "Book Plane Ticket"</p>

<p><strong>Drift Detection:</strong></p>
<ul>
    <li>Agent starts discussing "Hotel Booking?"</li>
    <li><strong>Supervisor Eye</strong> detects drift</li>
    <li><strong>Intervention:</strong> Redirect to Ticket Search</li>
</ul>

<h2>Enterprise Agent Framework: Visual Index</h2>

<p><strong>Key Patterns by Domain:</strong></p>

<table>
    <thead>
        <tr>
            <th>Domain</th>
            <th>Pattern</th>
            <th>Use Case</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>CX</td>
            <td>Routing (Triage)</td>
            <td>Customer Service</td>
        </tr>
        <tr>
            <td>CX</td>
            <td>Memory (Tutor)</td>
            <td>Personalization</td>
        </tr>
        <tr>
            <td>DevOps</td>
            <td>Multi-Agent (Squad)</td>
            <td>Code Generation</td>
        </tr>
        <tr>
            <td>DevOps</td>
            <td>Reflection (Self-Heal)</td>
            <td>Quality Assurance</td>
        </tr>
        <tr>
            <td>Content</td>
            <td>Chaining (Assembly)</td>
            <td>Content Creation</td>
        </tr>
        <tr>
            <td>Content</td>
            <td>Parallelization (Research)</td>
            <td>Market Analysis</td>
        </tr>
        <tr>
            <td>Governance</td>
            <td>HITL (Safety)</td>
            <td>High-Stakes Decisions</td>
        </tr>
        <tr>
            <td>Ops</td>
            <td>Tool Use (Accuracy)</td>
            <td>Calculations</td>
        </tr>
        <tr>
            <td>Ops</td>
            <td>Model Routing (Cost)</td>
            <td>Resource Optimization</td>
        </tr>
        <tr>
            <td>Ops</td>
            <td>Objective Monitoring (Drift)</td>
            <td>Task Adherence</td>
        </tr>
    </tbody>
</table>

<h2>Kết Luận: From Prompting to Engineering</h2>

<blockquote>
<strong>Design the workflow first. The intelligence will follow.</strong>
</blockquote>

<p>Để chuyển từ <strong>Demo</strong> sang <strong>Production</strong>:</p>
<ul>
    <li>Stop treating AI as a magic chat box</li>
    <li>Start treating it as a <strong>component in a structured workflow</strong></li>
    <li>Apply engineering principles: <strong>Reflection & HITL</strong></li>
    <li>Focus on <strong>Reliable, Auditable, Production-ready</strong> systems</li>
</ul>

<p><em>Nguồn: Enterprise AI Agent Patterns Playbook • Tổng hợp bởi Quy Phu Nguyen - Antigravity VN</em></p>
' 
WHERE id = 1;
