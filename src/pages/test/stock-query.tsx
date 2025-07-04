import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/components/Stock/SearchBar";
import TradingCard from "@/components/Stock/TradingCard";
import ChartContainer from "@/components/Stock/ChartContainer";
import DataTable from "@/components/Stock/DataTable";
import LoadingSpinner from "@/components/Stock/LoadingSpinner";
import { EmptyState, ErrorState } from "@/components/Stock/StateComponents";
import { useStockData } from "@/hooks/useStockData";
import { ChartBarIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import TechnicalAnalysisPanel from "@/components/Stock/TechnicalAnalysisPanel";
import KLinePattern from "@/components/Stock/KLinePattern";
import type { MarketType } from "@/components/Stock/SearchBar";

// 型別與預設值集中
const VIEW_OPTIONS = [
  {
    key: "chart",
    label: "圖表",
    icon: <ChartBarIcon className="h-5 w-5 inline-block align-text-bottom" />,
  },
  {
    key: "table",
    label: "數據",
    icon: <TableCellsIcon className="h-5 w-5 inline-block align-text-bottom" />,
  },
] as const;
type ViewType = (typeof VIEW_OPTIONS)[number]["key"];
const DEFAULT_TIMEFRAME = "1d";
const DEFAULT_PERIOD = "1Y";

type Timeframe = "1d" | "1h";
type DataPeriod = "YTD" | "1M" | "3M" | "6M" | "1Y" | "ALL";

const StockAnalysisPage: React.FC = () => {
  const [queryState, setQueryState] = useState<{
    symbol: string;
    market: MarketType;
  }>({
    symbol: "",
    market: "market_stock_tw",
  });
  const [activeView, setActiveView] = useState<ViewType>("chart");
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [dataPeriod, setDataPeriod] = useState<DataPeriod>(DEFAULT_PERIOD);

  const {
    data,
    loading,
    error,
    stats,
    candlestickData,
    technicalData,
    refetch,
    clearError,
  } = useStockData(queryState.symbol, timeframe, queryState.market);

  // useCallback 依賴優化
  const handleSymbolChange = useCallback((symbol: string) => {
    setQueryState((q) => ({ ...q, symbol }));
  }, []);

  const handleMarketChange = useCallback((market: MarketType) => {
    setQueryState((q) => ({ ...q, market }));
  }, []);

  const handleSymbolAndMarketChange = useCallback(
    (symbol: string, market: MarketType) => {
      setQueryState({ symbol, market });
    },
    []
  );

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
  }, []);

  const handleDataPeriodChange = useCallback((period: DataPeriod) => {
    setDataPeriod(period);
  }, []);

  // 取最新一根K線
  const latest = useMemo(
    () => candlestickData?.slice(-1)[0],
    [candlestickData]
  );

  // KLinePattern 與 TechnicalAnalysisPanel 統一渲染
  const renderPatternAndPanel = useCallback(
    () => (
      <>
        <KLinePattern
          symbol={queryState.symbol}
          timeframe={timeframe}
          market={queryState.market}
        />
        <TechnicalAnalysisPanel
          technicalData={technicalData}
          symbol={queryState.symbol}
          timeframe={timeframe}
          open_price={latest?.open}
          high_price={latest?.high}
          low_price={latest?.low}
          close_price={latest?.close}
          volume={latest?.volume}
          loading={loading}
          candlestickData={candlestickData}
        />
      </>
    ),
    [
      latest,
      candlestickData,
      technicalData,
      queryState.symbol,
      timeframe,
      loading,
      queryState.market,
    ]
  );

  // renderContent 拆分
  const renderContent = useCallback(() => {
    if (loading) return <LoadingSpinner />;
    if (error)
      return (
        <ErrorState error={error} onRetry={refetch} onClear={clearError} />
      );
    if (!data || data.length === 0)
      return <EmptyState onQuickSelect={handleSymbolChange} />;
    switch (activeView) {
      case "chart":
        return (
          <>
            <ChartContainer
              data={candlestickData}
              technicalData={technicalData}
              symbol={queryState.symbol}
              timeframe={timeframe}
            />
            {renderPatternAndPanel()}
          </>
        );
      case "table":
        return (
          <>
            <DataTable
              data={data}
              timeframe={timeframe}
              symbol={queryState.symbol}
            />
            {renderPatternAndPanel()}
          </>
        );
      default:
        return null;
    }
  }, [
    loading,
    error,
    data,
    activeView,
    candlestickData,
    technicalData,
    queryState.symbol,
    timeframe,
    refetch,
    clearError,
    handleSymbolChange,
    renderPatternAndPanel,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 搜索欄 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SearchBar
            symbol={queryState.symbol}
            onSymbolChange={handleSymbolChange}
            timeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
            loading={loading}
            dataPeriod={dataPeriod}
            onDataPeriodChange={handleDataPeriodChange}
            market={queryState.market}
            onMarketChange={handleMarketChange}
            onSymbolAndMarketChange={handleSymbolAndMarketChange}
          />
        </motion.div>

        {/* 視圖切換 */}
        {data && data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mb-6"
          >
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <div className="flex space-x-1">
                {VIEW_OPTIONS.map((view) => (
                  <motion.button
                    key={view.key}
                    onClick={() => setActiveView(view.key as ViewType)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeView === view.key
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-2">{view.icon}</span>
                    {view.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 交易卡片 */}
        {stats && data && data.length > 0 && !loading && !error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TradingCard
              symbol={queryState.symbol}
              stats={stats}
              timeframe={timeframe}
            />
          </motion.div>
        ) : null}

        {/* 主要內容區域 */}
        {renderContent()}
      </div>
    </div>
  );
};

export default StockAnalysisPage;
