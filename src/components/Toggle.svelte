<script lang="ts">
    export let title: string;
    export let description: string;
    export let value: boolean;
    export let onClick: () => void;
</script>

<label class="setting">
    <div class="setting-text">
        <div class="label">{title}</div>
        <div class="description">{description}</div>
    </div>
    <button
        class="toggle"
        class:active={value}
        on:click={onClick}
        role="switch"
        aria-checked={value}
        aria-label={title}
    >
        <span class="toggle-knob"></span>
    </button>
</label>

<style>
    .setting {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 8px 0;
        cursor: pointer;
    }

    .setting {
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .setting-text {
        min-width: 0;
    }

    .label {
        font-size: 0.84rem;
        font-weight: 500;
        color: #d1d5db;
        line-height: 1.3;
    }

    .description {
        margin-top: 2px;
        font-size: 0.72rem;
        line-height: 1.4;
        color: #6b7280;
    }

    .toggle {
        position: relative;
        width: 36px;
        height: 20px;
        border-radius: 10px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s ease;
        padding: 0;
    }

    .toggle.active {
        background: #6366f1;
    }

    .toggle-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.15s ease;
    }

    .toggle.active .toggle-knob {
        transform: translateX(16px);
    }
</style>
