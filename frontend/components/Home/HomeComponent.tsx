import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Row = {
	name: string;
	erpId: string;
	LoginTime: number;
	LogoutTime: number;
	Date: string;
	TotalHours: number;
};

const rows: Row[] = [
	{  name: 'Aarav', erpId: 'ERP001', LoginTime: 10.00 , LogoutTime: 18.00 , Date: '2023-10-01', TotalHours: 8 },
	
];

type AuthUser = {
	id: string;
	erpId: string;
	name: string;
	role: string | null;
};

type HomeComponentProps = {
	user?: AuthUser;
	onLogout?: () => void;
};

export default function HomeComponent({ user, onLogout }: HomeComponentProps) {
	const today = {
		...rows[0],
		name: user?.name ?? rows[0].name,
		erpId: user?.erpId ?? rows[0].erpId,
	};

	return (
		<View style={styles.screen}>
			<View style={styles.heroCard}>
				<Text style={styles.welcomeText}>Welcome back 👋</Text>
				<Text style={styles.title}>Home Dashboard</Text>
				<Text style={styles.subtitle}>Track your daily campus attendance in one place.</Text>
				{onLogout ? (
					<TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
						<Text style={styles.logoutText}>Logout</Text>
					</TouchableOpacity>
				) : null}

				<View style={styles.statsRow}>
					<View style={styles.statChip}>
						<Text style={styles.statLabel}>Today</Text>
						<Text style={styles.statValue}>{today.Date}</Text>
					</View>
					<View style={styles.statChip}>
						<Text style={styles.statLabel}>Hours</Text>
						<Text style={styles.statValue}>{today.TotalHours}h</Text>
					</View>
				</View>
			</View>

			<View style={styles.tableWrapper}>
				<Text style={styles.sectionTitle}>Today Attendance</Text>
				<View style={styles.detailsTable}>
					<View style={styles.detailItem}>
						<Text style={styles.detailLabel}>Name</Text>
						<Text style={styles.detailValue}>{today.name}</Text>
					</View>
					<View style={styles.detailItem}>
						<Text style={styles.detailLabel}>ERP ID</Text>
						<Text style={styles.detailValue}>{today.erpId}</Text>
					</View>
					<View style={styles.detailItem}>
						<Text style={styles.detailLabel}>Login Time</Text>
						<Text style={styles.detailValue}>{today.LoginTime.toFixed(2)} AM</Text>
					</View>
					<View style={styles.detailItem}>
						<Text style={styles.detailLabel}>Logout Time</Text>
						<Text style={styles.detailValue}>{today.LogoutTime.toFixed(2)} PM</Text>
					</View>
					<View style={styles.detailItem}>
						<Text style={styles.detailLabel}>Date</Text>
						<Text style={styles.detailValue}>{today.Date}</Text>
					</View>
					<View style={styles.detailItem}>
						<Text style={styles.detailLabel}>Total Hours</Text>
						<Text style={styles.detailValue}>{today.TotalHours.toFixed(2)}</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#0f172a',
		paddingTop: 24,
		paddingHorizontal: 16,
		paddingBottom: 16,
		gap: 16,
	},
	heroCard: {
		width: '100%',
		maxWidth: 420,
		alignSelf: 'center',
		backgroundColor: '#1d4ed8',
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: '#60a5fa',
	},
	welcomeText: {
		color: '#dbeafe',
		fontWeight: '600',
		marginBottom: 4,
	},
	title: {
		color: '#ffffff',
		fontSize: 22,
		fontWeight: '800',
	},
	subtitle: {
		color: '#e0ecff',
		marginTop: 6,
		lineHeight: 20,
	},
	logoutButton: {
		marginTop: 12,
		alignSelf: 'flex-start',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#bfdbfe',
	},
	logoutText: {
		color: '#eff6ff',
		fontWeight: '700',
		fontSize: 12,
	},
	statsRow: {
		marginTop: 14,
		flexDirection: 'row',
		gap: 10,
	},
	statChip: {
		flex: 1,
		backgroundColor: '#1e40af',
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
	},
	statLabel: {
		color: '#bfdbfe',
		fontSize: 12,
		fontWeight: '600',
	},
	statValue: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '700',
		marginTop: 2,
	},
	tableWrapper: {
		width: '100%',
		maxWidth: 420,
		alignSelf: 'center',
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 14,
		marginTop: 13,
		borderWidth: 1,
		borderColor: '#334155',
	},
	sectionTitle: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '700',
		textAlign: 'left',
		marginBottom: 6,
	},
	detailsTable: {
		marginTop: 6,
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	detailItem: {
		width: '48%',
		backgroundColor: '#0f172a',
		borderWidth: 1,
		borderColor: '#334155',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
	},
	detailLabel: {
		color: '#bfdbfe',
		fontSize: 12,
		fontWeight: '600',
	},
	detailValue: {
		color: '#e2e8f0',
		fontSize: 13,
		marginTop: 4,
		fontWeight: '700',
	},
});
