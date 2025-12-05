/**
 * 日期时间工具函数
 */

/**
 * 格式化 ISO 8601 时间字符串
 * 将 2025-12-05T16:54:42+08:00 格式化为 2025-12-05 16:54:42
 * @param dateTime - ISO 8601 格式的时间字符串
 * @returns 格式化后的时间字符串，如果输入无效则返回 '-'
 */
export const formatDateTime = (dateTime: string | null | undefined): string => {
    if (!dateTime) {
        return '-'
    }

    try {
        // 使用 Date 对象解析 ISO 8601 格式的时间
        const date = new Date(dateTime)

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            return '-'
        }

        // 格式化为 YYYY-MM-DD HH:mm:ss
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (error) {
        console.error('格式化时间失败:', error)
        return '-'
    }
}

/**
 * 格式化日期（不包含时间）
 * 将 2025-12-05T16:54:42+08:00 格式化为 2025-12-05
 * @param dateTime - ISO 8601 格式的时间字符串
 * @returns 格式化后的日期字符串，如果输入无效则返回 '-'
 */
export const formatDate = (dateTime: string | null | undefined): string => {
    if (!dateTime) {
        return '-'
    }

    try {
        const date = new Date(dateTime)

        if (isNaN(date.getTime())) {
            return '-'
        }

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    } catch (error) {
        console.error('格式化日期失败:', error)
        return '-'
    }
}

/**
 * 格式化时间（不包含日期）
 * 将 2025-12-05T16:54:42+08:00 格式化为 16:54:42
 * @param dateTime - ISO 8601 格式的时间字符串
 * @returns 格式化后的时间字符串，如果输入无效则返回 '-'
 */
export const formatTime = (dateTime: string | null | undefined): string => {
    if (!dateTime) {
        return '-'
    }

    try {
        const date = new Date(dateTime)

        if (isNaN(date.getTime())) {
            return '-'
        }

        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        return `${hours}:${minutes}:${seconds}`
    } catch (error) {
        console.error('格式化时间失败:', error)
        return '-'
    }
}

