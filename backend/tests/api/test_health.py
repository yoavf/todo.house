import pytest
from unittest.mock import Mock, patch


class TestHealthEndpoint:
    """Test the health check endpoint."""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, async_client, mock_supabase):
        """Test successful health check when Supabase is connected."""
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = Mock(data=[])
        
        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_health_check_database_error(self, async_client, mock_supabase):
        """Test health check when database connection fails."""
        mock_supabase.table.side_effect = Exception("Database connection failed")
        
        response = await async_client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
        assert "error" in data
        assert "Database connection failed" in data["error"]
    
    @pytest.mark.asyncio
    async def test_health_check_returns_timestamp(self, async_client, mock_supabase):
        """Test that health check includes a valid timestamp."""
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = Mock(data=[])
        
        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        
        from datetime import datetime
        timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
        assert isinstance(timestamp, datetime)
    
    @pytest.mark.asyncio
    async def test_health_check_cors_headers(self, async_client, mock_supabase):
        """Test that health check endpoint has proper CORS headers."""
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = Mock(data=[])
        
        response = await async_client.get("/health")
        assert response.status_code == 200
        
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"