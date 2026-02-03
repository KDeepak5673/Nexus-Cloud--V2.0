function StatCard({ icon, value, label }) {
    return (
        <div className="stat-card">
            <i className={icon}></i>
            <h3>{value}</h3>
            <p>{label}</p>
        </div>
    );
}

export default StatCard;