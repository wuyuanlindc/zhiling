"use client";

import { useEffect, useRef, useState } from "react";

function getInitialTab(): "pc" | "mt" | "h5" {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "pc" || tabParam === "mt" || tabParam === "h5") {
      return tabParam;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash === "pc" || hash === "mt" || hash === "h5") {
      return hash as "pc" | "mt" | "h5";
    }
  }
  return "pc";
}

export default function Home() {
  const [activeTab] = useState<"pc" | "mt" | "h5">(getInitialTab);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const scriptInjectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (activeTab !== "pc") return;
    if (scriptInjectedRef.current) return;
    scriptInjectedRef.current = true;

    // Load prototype script natively into the document DOM without interfering with React's node reconciliation
    const existing = document.getElementById("prototype-native-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "prototype-native-script";
      script.src = "/prototype.js";
      script.async = false;
      script.onload = () => {
        if (typeof window !== "undefined" && (window as unknown as { lucide?: { createIcons: () => void } }).lucide) {
          (window as unknown as { lucide: { createIcons: () => void } }).lucide.createIcons();
        }
      };
      document.body.appendChild(script);
    }
  }, [activeTab]);

  if (activeTab === "mt") {
    return (
      <main className="w-screen h-screen overflow-hidden bg-[#edf1f2]">
        <iframe src="/mt.html" className="w-full h-full border-0 block" title="指令MT端" />
      </main>
    );
  }

  if (activeTab === "h5") {
    return (
      <main className="w-screen h-screen overflow-hidden bg-[#edf1f2]">
        <iframe src="/h5.html" className="w-full h-full border-0 block" title="指令H5端" />
      </main>
    );
  }

  // Native Next.js DOM Structure for PC (No iframe! All DOM elements selectable!)
  return (
    <div className="app">
      <header className="top">
        <div className="top-inner">
          <div className="brand flex items-center">
            <img className="brand-logo" src="/brand-logo.png" alt="正营用 wxb.cn" />
            <div className="system-name">指令流转中心</div>
            <div className="org">台湾省网信办</div>
          </div>
          <div className="tools">
            <button className="guide-return-btn" data-action="open-guide">
              返回统一入口
            </button>
            <button className="tool-circle" data-pop="todo" title="待办">
              <i data-lucide="calendar-days" width="18"></i>
              <span className="dot"></span>
            </button>
            <button className="tool-circle" data-pop="notice" title="通知">
              <i data-lucide="bell" width="18"></i>
              <span className="dot"></span>
            </button>
            <button className="tool-circle" data-pop="service" title="客服">
              <i data-lucide="headphones" width="18"></i>
            </button>
            <div className="user-profile-menu-container" id="user-profile-menu-container">
              <button
                type="button"
                className="user-profile-trigger"
                id="user-profile-trigger"
                data-action="toggle-user-menu"
                title="点击切换演示用户"
              >
                <div className="avatar" id="top-user-avatar">
                  武甲
                </div>
                <span className="user-name" id="top-user-name">
                  武甲<i data-lucide="chevron-down" width="14" height="14"></i>
                </span>
              </button>
              <div className="user-profile-dropdown" id="user-profile-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-title">
                    <i data-lucide="users-round" width="14"></i>切换演示用户
                  </div>
                  <span className="user-dropdown-sub">快速模拟不同岗位角色的指令权限与视角</span>
                </div>
                <div className="user-dropdown-list">
                  <button
                    type="button"
                    className="user-dropdown-item active"
                    data-action="switch-demo-user"
                    data-user="武甲"
                  >
                    <div className="user-item-avatar">武甲</div>
                    <div className="user-item-info">
                      <div className="user-item-name-row">
                        <span className="user-item-name">武甲</span>
                        <span className="user-item-role-tag">主管/下发</span>
                      </div>
                      <span className="user-item-duty">综合处 · 指令下发、统筹监管与审核</span>
                    </div>
                    <div className="user-item-check">
                      <i data-lucide="check" width="16"></i>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="user-dropdown-item"
                    data-action="switch-demo-user"
                    data-user="武乙"
                  >
                    <div className="user-item-avatar">武乙</div>
                    <div className="user-item-info">
                      <div className="user-item-name-row">
                        <span className="user-item-name">武乙</span>
                        <span className="user-item-role-tag">专班办理</span>
                      </div>
                      <span className="user-item-duty">处置专班 · 舆情接单处置、回执与转办</span>
                    </div>
                    <div className="user-item-check">
                      <i data-lucide="check" width="16"></i>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="user-dropdown-item"
                    data-action="switch-demo-user"
                    data-user="武丙"
                  >
                    <div className="user-item-avatar">武丙</div>
                    <div className="user-item-info">
                      <div className="user-item-name-row">
                        <span className="user-item-name">武丙</span>
                        <span className="user-item-role-tag">安全技术</span>
                      </div>
                      <span className="user-item-duty">网络安全科 · 协同会商与技术核验</span>
                    </div>
                    <div className="user-item-check">
                      <i data-lucide="check" width="16"></i>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="user-dropdown-item"
                    data-action="switch-demo-user"
                    data-user="武丁"
                  >
                    <div className="user-item-avatar">武丁</div>
                    <div className="user-item-info">
                      <div className="user-item-name-row">
                        <span className="user-item-name">武丁</span>
                        <span className="user-item-role-tag">综合值班</span>
                      </div>
                      <span className="user-item-duty">值班室 · 待阅接单响应与流转督办</span>
                    </div>
                    <div className="user-item-check">
                      <i data-lucide="check" width="16"></i>
                    </div>
                  </button>
                </div>
                <div className="user-dropdown-footer">
                  <i data-lucide="info" width="13"></i> 点击即可切换角色视角并联动刷新指令数据
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-item nav-home">
            <i data-lucide="layout-grid" width="20"></i>
          </button>
          <button className="nav-item active" data-page="todo">
            我的指令
          </button>
          <button className="nav-item" data-page="stats">
            统计
          </button>
          <button className="nav-item" data-page="org">
            机构用户
          </button>
          <button className="nav-item" data-page="external">
            外部联系人
          </button>
          <button className="nav-item" data-page="sent-mgmt">
            指令监控
          </button>
          <button className="nav-item" data-page="settings">
            系统设置
          </button>
        </div>
      </nav>

      {/* suppressHydrationWarning ensures React does not conflict with vanilla JS innerHTML updates inside #page */}
      <main id="page" ref={pageContainerRef} suppressHydrationWarning></main>

      <div id="popover" className="toolbar-pop"></div>
      <div id="modalRoot" className="modal-mask"></div>
      <div id="toast" className="toast"></div>
      <div className="watermark"></div>
    </div>
  );
}
