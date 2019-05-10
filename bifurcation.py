# -----------------------
# Trace out the bifurcations for a given number of
# bounces where energy starts at -1/3. When a
# bifurcation is found, trace it out using a vector
# and varying p_phi
# -----------------------

# Import needed libraries
import magphyxp
import numpy as np
import sys

# -----------------------
# Variables deciding whether
# pphi is constant or ptheta
# is constant
VARY_PTHETA_PPHI = 0
VARY_PTHETA_ENERGY = 1
# -----------------------

def get_pphi_max(E, ptheta):
    x = (E + 1/3 - ptheta**2 / 2) / 5
    if x < 0:
        return -1
    return np.sqrt(x)

def trace_mode(curr_state, mode_id):
    # Used in determining if the energy is increasing within some margin
    epsilon = 1e-2
    #vector = np.array((0, V_STEP, 0)) # Setup vector
    vector = np.array((curr_state[0], curr_state[1], 0)) # Setup vector
    #vector = np.array((V_STEP, V_STEP, 0)) # Setup vector
    new_bifurcation = True
    while (curr_state[2] < 0):
        next_state = curr_state + vector # Follow the vector to next state
        prev_state = next_state # Save state where we came from
        pphi_max = get_pphi_max(next_state[2], next_state[0])
        if (pphi_max < 0 or next_state[1] > pphi_max or next_state[2] > 0):
            print('break 1.2')
            break
        # Calculate new min at new location
        min_two = magphyxp.calculate_min(next_state[0], next_state[1], num_bounces, next_state[2], 1e-7, VARY_PTHETA_ENERGY, 1e-7) 
        if min_two.f > 1e-9:
            print('break 2: f={}'.format(min_two.f))
            break
        next_state = np.array((min_two.ptheta, min_two.pphi, min_two.energy)) # New min gives new state

        # Find new vector
        vector = next_state - curr_state

        curr_state = next_state # Change current state to the newest one found
        if (next_state[2] < (prev_state[2] - epsilon)): # Make sure energy is increasing within some tolerance
            print('break 3')
            break
        # Write out ID, N, pr, ptheta, pphi, energy, rocking number, in phase, period
        if new_bifurcation:
            new_bifurcation = False
            mode_id += 1
        f.write(
            '{} {} {:<.5f} {:<.5f} {:<.5f} {:<.5f} {} {} {:<.5f}\n'.format(
            mode_id,num_bounces, np.sqrt(abs(2*curr_state[2] + 2/3 - curr_state[0]**2 - 10*curr_state[1]**2)), curr_state[0], curr_state[1],
            #curr_state[2], int(bifurcation_state.rocking_number / 2), bifurcation_state.rocking_in_phase, min_two.t)
            curr_state[2], int(min_two.rocking_number / 2), min_two.rocking_in_phase, min_two.t)
        )
        # f.flush()
        # Slowly increase the step size of the vector
        #vector *= 1.1
        vector[1] *= 1.1
        vector[2] *= 1.1
        # -------------------------------------------
        epsilon *= 0.9 # Slowly decrease tolerance of energy difference


fn = '/home/bojohnson/Desktop/traces.txt'
if len(sys.argv) > 1:
    fn = sys.argv[1]
f = open(fn,'w') # File to write data to
bifurcation_id = 0
for num_bounces in range(1,2):#65):
    # For each bounce number start the search
    # with the given energy value E, the given V_STEP
    # which is the vector step size in tracing out
    # the bifurcation, and E_step which determines the
    # step for E
    E = -1/3 + 1e-4
    previous_E = -1 # Placeholder for now
    #previous_t = -1 # Placeholder for now
    V_STEP = 1e-3
    E_step = 1e-7
    PTHETA_0 = 0
    PPHI_0 = 1e-9
    # ------------------------------------------------
    while (E <= 0):
        # Calculate minimum
        bifurcation_state = magphyxp.calculate_min(PTHETA_0, PPHI_0, num_bounces, E, 1e-7,
                                                   VARY_PTHETA_ENERGY, 1e-7)
        # Also look one more step in the future to see if this is a true bifurcation
        #next = magphyxp.calculate_min(bifurcation_statenext_state[0], next_state[1], num_bounces, next_state[2], 1e-7, VARY_PTHETA_ENERGY, 1e-7) 

        bifurcation_E = 1
        pphi_max = get_pphi_max(bifurcation_state.energy, bifurcation_state.ptheta)
        if (bifurcation_state.f < 1e-9 and bifurcation_state.energy > -1/3
            and bifurcation_state.energy - previous_E > E_step
            and V_STEP < pphi_max
            and bifurcation_state.t > 0.0):

            print('bifurcation found: {} {} {} f={}'.format(bifurcation_state.ptheta, bifurcation_state.pphi, bifurcation_state.energy, bifurcation_state.f))
            #and bifurcation_state.t - previous_t > 1):
            # Get the current state of pphi, ptheta, and energy
            curr_state = np.array((bifurcation_state.ptheta, bifurcation_state.pphi, bifurcation_state.energy))
            bifurcation_E = bifurcation_state.energy

            trace_mode(curr_state, bifurcation_id)
            bifurcation_id += 1
            previous_E = bifurcation_state.energy
        E_step = E_step * 1.01
        #if bifurcation_E < 0:
        #    print('updating E')
        #    E = bifurcation_E
        E = E + E_step

f.close()
