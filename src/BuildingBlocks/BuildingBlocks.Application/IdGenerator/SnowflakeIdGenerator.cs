using System;
using System.Threading;
using BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator;

namespace BuildingBlocks.Application.IdGenerator;

public class SnowflakeIdGenerator : ISnowflakeIdGenerator, IIdGenerator
{
    private const int WorkerIdBits = 5;
    private const int DatacenterIdBits = 5;
    private const int SequenceBits = 12;

    private const long MaxWorkerId = -1L ^ (-1L << WorkerIdBits); // 31
    private const long MaxDatacenterId = -1L ^ (-1L << DatacenterIdBits); // 31
    private const long SequenceMask = -1L ^ (-1L << SequenceBits); // 4095

    private const int WorkerIdShift = SequenceBits; // 12
    private const int DatacenterIdShift = SequenceBits + WorkerIdBits; // 17
    private const int TimestampLeftShift = SequenceBits + WorkerIdBits + DatacenterIdBits; // 22

    // Custom Epoch: 2025-01-01 00:00:00 UTC (1735689600000 ms)
    private const long Epoch = 1735689600000L;

    private readonly long _workerId;
    private readonly long _datacenterId;
    private readonly object _lock = new();

    private long _lastTimestamp = -1L;
    private long _sequence = 0L;

    public SnowflakeIdGenerator(long workerId = 1, long datacenterId = 1)
    {
        if (workerId < 0 || workerId > MaxWorkerId)
            throw new ArgumentOutOfRangeException(nameof(workerId), $"WorkerId must be between 0 and {MaxWorkerId}");
        if (datacenterId < 0 || datacenterId > MaxDatacenterId)
            throw new ArgumentOutOfRangeException(nameof(datacenterId), $"DatacenterId must be between 0 and {MaxDatacenterId}");

        _workerId = workerId;
        _datacenterId = datacenterId;
    }

    public long NewId()
    {
        lock (_lock)
        {
            var timestamp = GetCurrentTimestamp();

            if (timestamp < _lastTimestamp)
            {
                var diff = _lastTimestamp - timestamp;
                if (diff <= 10)
                {
                    Thread.Sleep((int)diff + 1);
                    timestamp = GetCurrentTimestamp();
                }
                else
                {
                    throw new InvalidOperationException($"Clock moved backwards. Refusing to generate id for {diff} milliseconds");
                }
            }

            if (_lastTimestamp == timestamp)
            {
                _sequence = (_sequence + 1) & SequenceMask;
                if (_sequence == 0)
                {
                    timestamp = WaitNextMillis(_lastTimestamp);
                }
            }
            else
            {
                _sequence = 0L;
            }

            _lastTimestamp = timestamp;

            return ((timestamp - Epoch) << TimestampLeftShift)
                   | (_datacenterId << DatacenterIdShift)
                   | (_workerId << WorkerIdShift)
                   | _sequence;
        }
    }

    public long CreateId() => NewId();

    private static long GetCurrentTimestamp() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    private static long WaitNextMillis(long lastTimestamp)
    {
        var timestamp = GetCurrentTimestamp();
        while (timestamp <= lastTimestamp)
        {
            timestamp = GetCurrentTimestamp();
        }
        return timestamp;
    }
}
